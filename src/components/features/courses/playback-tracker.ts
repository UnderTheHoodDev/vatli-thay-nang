export type Segment = [number, number];

export interface PendingPlayback {
  segments: Segment[];
  watchedSeconds: number;
}

// Backend nhận tối đa 100 đoạn mỗi lần gửi.
const MAX_SEGMENTS = 100;

function mergeSegments(segments: Segment[]): Segment[] {
  const sorted = segments.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out: Segment[] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 0.5) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out.slice(-MAX_SEGMENTS);
}

/**
 * Ghi nhận những gì học sinh THẬT SỰ xem trên một thẻ <video>:
 * - segments: các đoạn nội dung [từ, đến] (giây) đã chạy — tua thì tách đoạn mới, nên
 *   tua qua không được tính, xem 2× vẫn đủ nội dung;
 * - watchedSeconds: thời gian đồng hồ video thật sự chạy — không tính lúc dừng, lúc đang
 *   tải (waiting) hay lúc tab đang mở nhưng video đứng yên.
 */
export class PlaybackTracker {
  /** Gọi khi video dừng/hết — để gửi ngay, không đợi nhịp 10s. */
  onStop: (() => void) | null = null;

  private segStart: number | null = null;
  private segLast = 0;
  private lastUpdateAt = 0;
  private playingSince: number | null = null;
  private watchedMs = 0;
  private segments: Segment[] = [];

  constructor(private readonly video: HTMLVideoElement) {}

  attach(): () => void {
    const v = this.video;
    const onPlaying = () => this.startRun();
    const onStop = () => {
      this.stopRun();
      this.onStop?.();
    };
    const onWaiting = () => this.stopRun();
    const onSeeking = () => this.closeSegment();
    const onSeeked = () => {
      if (!v.paused && v.readyState >= 3) this.startRun();
    };
    const onTimeUpdate = () => this.onTimeUpdate();
    const events: [string, () => void][] = [
      ['playing', onPlaying],
      ['pause', onStop],
      ['ended', onStop],
      ['waiting', onWaiting],
      ['seeking', onSeeking],
      ['seeked', onSeeked],
      ['timeupdate', onTimeUpdate],
    ];
    for (const [e, h] of events) v.addEventListener(e, h);
    if (!v.paused && v.readyState >= 3) this.startRun();
    return () => {
      for (const [e, h] of events) v.removeEventListener(e, h);
      this.stopRun();
    };
  }

  /** Lấy phần chưa gửi; đoạn đang chạy được cắt tại chỗ hiện tại rồi chạy tiếp. */
  take(): PendingPlayback {
    if (this.playingSince != null) {
      const now = performance.now();
      this.watchedMs += now - this.playingSince;
      this.playingSince = now;
      if (this.segStart != null && this.segLast > this.segStart) {
        this.segments.push([this.segStart, this.segLast]);
        this.segStart = this.segLast;
      }
    }
    const watchedSeconds = Math.floor(this.watchedMs / 1000);
    this.watchedMs -= watchedSeconds * 1000;
    const segments = mergeSegments(this.segments);
    this.segments = [];
    return { segments, watchedSeconds };
  }

  /** Gửi lỗi → trả lại để lần sau gửi bù, không mất số liệu. */
  restore(p: PendingPlayback) {
    this.segments = mergeSegments([...p.segments, ...this.segments]);
    this.watchedMs += p.watchedSeconds * 1000;
  }

  private startRun() {
    const now = performance.now();
    if (this.playingSince == null) this.playingSince = now;
    if (this.segStart == null) {
      this.segStart = this.segLast = this.video.currentTime;
      this.lastUpdateAt = now;
    }
  }

  private stopRun() {
    this.closeSegment();
    if (this.playingSince != null) {
      this.watchedMs += performance.now() - this.playingSince;
      this.playingSince = null;
    }
  }

  private closeSegment() {
    if (this.segStart != null && this.segLast > this.segStart) {
      this.segments.push([this.segStart, this.segLast]);
    }
    this.segStart = null;
  }

  private onTimeUpdate() {
    if (this.playingSince == null || this.segStart == null) return;
    const now = performance.now();
    const t = this.video.currentTime;
    const jump = t - this.segLast;
    // Nhảy lùi, hoặc tiến nhanh hơn tốc độ phát tối đa cho phép = tua (đã lỡ sự kiện
    // seeking) → đóng đoạn cũ, mở đoạn mới tại vị trí hiện tại.
    const maxForward = ((now - this.lastUpdateAt) / 1000) * 2.5 + 0.75;
    if (jump < 0 || jump > maxForward) {
      this.closeSegment();
      this.segStart = t;
    }
    this.segLast = t;
    this.lastUpdateAt = now;
  }
}
