'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';
import {
  getProgress,
  sendBeat,
  startView,
  TrackingTokenExpiredError,
  type BeatPayload,
} from '@/lib/video-tracking-client';
import { cn } from '@/lib/utils';
import type { BunnyVideoStatus } from '@/types/course-management';
import { PlaybackTracker } from './playback-tracker';

interface Props {
  nodeId: number;
  /** URL HLS (.m3u8) — phát bằng hls.js. */
  videoUrl: string;
  /** Dùng dựng URL nhúng dự phòng khi hls.js lỗi. */
  bunnyVideoId?: string | null;
  bunnyLibraryId?: number | null;
  durationSeconds?: number | null;
  bunnyStatus: BunnyVideoStatus;
  title?: string;
  /** false = xem thuần (admin preview): không gọi tracking, phát từ đầu. Mặc định true. */
  track?: boolean;
  /** true = lấp đầy khung cha thay vì aspect-video (modal xem gần full màn hình). */
  fill?: boolean;
}

const HEARTBEAT_INTERVAL_MS = 10_000;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
// plyr xuất kiểu CommonJS (`export = Plyr`) nên lấy kiểu instance qua InstanceType.
type PlyrInstance = InstanceType<typeof import('plyr')>;
// Giá trị "Auto" trong menu chất lượng (hls.js ABR tự chọn) — 0 không trùng height nào.
const QUALITY_AUTO = 0;

export default function VideoPlayer({
  nodeId,
  videoUrl,
  bunnyVideoId,
  bunnyLibraryId,
  durationSeconds,
  bunnyStatus,
  title,
  track = true,
  fill = false,
}: Props) {
  const [initialPosition, setInitialPosition] = useState<number | null>(null);
  // hls.js lỗi (không hỗ trợ / chặn / decode) → rơi về iframe embed của Bunny.
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Vị trí phát THẬT + bộ ghi nhận đoạn đã xem, chỉ có khi phát bằng <video>. Iframe dự
  // phòng của Bunny không cho biết video có đang chạy hay không → không ghi thời gian/đoạn
  // nào, cũng không đẩy vị trí xem tiếp (trước đây ước lượng theo đồng hồ nên ghi khống).
  const playerReadyRef = useRef(false);
  const currentTimeRef = useRef(0);
  const trackerRef = useRef<PlaybackTracker | null>(null);

  // Lấy vị trí resume trước khi mount player.
  useEffect(() => {
    if (bunnyStatus !== 'FINISHED') return;
    if (!track) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialPosition(0);
      return;
    }
    let cancelled = false;
    getProgress(nodeId)
      .then((res) => {
        if (cancelled) return;
        setInitialPosition(res.data.lastPositionSec ?? 0);
      })
      .catch(() => {
        if (!cancelled) setInitialPosition(0);
      });
    return () => {
      cancelled = true;
    };
  }, [nodeId, bunnyStatus, track]);

  // hls.js + Plyr: nạp HLS vào <video>, dựng player có menu chất lượng/tốc độ,
  // seek tới vị trí dở, lắng nghe vị trí thật. Lỗi fatal → iframe embed dự phòng.
  useEffect(() => {
    if (bunnyStatus !== 'FINISHED' || initialPosition == null || useIframeFallback) return;
    const video = videoRef.current;
    if (!video) return;
    currentTimeRef.current = initialPosition;

    const seekToStart = () => {
      try {
        if (initialPosition > 0) video.currentTime = initialPosition;
      } catch {
        /* noop */
      }
    };
    const onLoadedMeta = () => {
      playerReadyRef.current = true;
      seekToStart();
    };
    const onTimeUpdate = () => {
      currentTimeRef.current = video.currentTime;
    };
    video.addEventListener('loadedmetadata', onLoadedMeta);
    video.addEventListener('timeupdate', onTimeUpdate);
    const tracker = new PlaybackTracker(video);
    const detachTracker = tracker.attach();
    trackerRef.current = tracker;

    let hls: Hls | null = null;
    let player: PlyrInstance | null = null;
    let watchdog: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    // Dựng Plyr với danh sách chất lượng lấy từ hls.js (rỗng = Safari native, chỉ tốc độ).
    const setupPlyr = async (qualities: number[]) => {
      // Interop CJS: webpack đặt class dưới `.default` lúc chạy, nhưng kiểu là chính class.
      const mod = (await import('plyr')) as unknown as { default: typeof import('plyr') };
      const Plyr = mod.default;
      if (destroyed || !videoRef.current) return;
      const options = qualities.length ? [QUALITY_AUTO, ...qualities] : [];
      player = new Plyr(video, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          'settings',
          'pip',
          'fullscreen',
        ],
        settings: ['quality', 'speed'],
        // Khung 16:9 cố định (letterbox video lệch tỉ lệ) — giữ layout như trước;
        // chế độ fill (modal admin) để Plyr tự lấp đầy chiều cao khung cha.
        ratio: fill ? undefined : '16:9',
        speed: { selected: 1, options: SPEED_OPTIONS },
        quality: options.length
          ? {
              default: QUALITY_AUTO,
              options,
              forced: true,
              onChange: (q: number) => {
                if (!hls) return;
                if (q === QUALITY_AUTO) {
                  hls.currentLevel = -1; // ABR tự động
                  return;
                }
                const idx = hls.levels.findIndex((l) => l.height === q);
                if (idx > -1) hls.currentLevel = idx;
              },
            }
          : undefined,
        i18n: { qualityLabel: { [QUALITY_AUTO]: 'Tự động' } },
        tooltips: { controls: true, seek: true },
      });
    };

    if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 30 });
      const activeHls = hls;
      let manifestParsed = false;
      let recovered = false;
      // Manifest không tải/parse được trong 12s (mạng treo / bị chặn) → iframe dự phòng.
      watchdog = setTimeout(() => {
        if (!manifestParsed) {
          console.warn('[video] hls.js quá thời gian tải manifest, chuyển iframe dự phòng');
          setUseIframeFallback(true);
        }
      }, 12_000);
      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        manifestParsed = true;
        if (watchdog) clearTimeout(watchdog);
        // Các mức chất lượng phân biệt theo chiều cao (720p, 1080p...), từ cao xuống thấp.
        const qualities = [...new Set(activeHls.levels.map((l) => l.height))].sort((a, b) => b - a);
        // Dựng Plyr TRƯỚC, gắn MSE (attachMedia) SAU — nếu attach trước, Plyr dựng lại
        // <video> khiến blob MSE cũ thành stale (ERR_FILE_NOT_FOUND ở console).
        await setupPlyr(qualities);
        if (!destroyed) activeHls.attachMedia(video);
      });
      hls.loadSource(videoUrl);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        // Fatal TRƯỚC khi có manifest = nguồn không tải được (404 / bị chặn); hls.js
        // đã tự retry nội bộ rồi mới báo fatal → không cố recover nữa, rơi iframe ngay.
        if (!manifestParsed) {
          if (watchdog) clearTimeout(watchdog);
          console.warn('[video] hls.js lỗi tải nguồn, chuyển iframe dự phòng', data.details);
          setUseIframeFallback(true);
          return;
        }
        // Lỗi giữa chừng (đã phát được): thử recover 1 lần rồi mới rơi iframe.
        if (!recovered) {
          recovered = true;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls?.startLoad();
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
            return;
          }
        }
        console.warn('[video] hls.js lỗi, chuyển iframe dự phòng', data.type, data.details);
        setUseIframeFallback(true);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS: HLS native (trình duyệt tự ABR, không có menu chất lượng thủ công).
      video.src = videoUrl;
      video.addEventListener('error', () => setUseIframeFallback(true));
      void setupPlyr([]);
    } else {
      // Trình duyệt không hỗ trợ HLS → dùng iframe player của Bunny.
      setUseIframeFallback(true);
    }

    return () => {
      destroyed = true;
      playerReadyRef.current = false;
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      video.removeEventListener('timeupdate', onTimeUpdate);
      detachTracker();
      if (trackerRef.current === tracker) trackerRef.current = null;
      if (watchdog) clearTimeout(watchdog);
      if (player) {
        try {
          player.destroy();
        } catch {
          /* noop */
        }
      }
      if (hls) hls.destroy();
    };
  }, [videoUrl, bunnyStatus, initialPosition, useIframeFallback]);

  // Tracking lifecycle: mở lượt xem (qua Vercel, có session) rồi gửi heartbeat THẲNG tới
  // backend bằng vé theo dõi. Chỉ gửi khi có gì mới (đang phát / vừa dừng); video đứng yên
  // thì im lặng — trước đây vẫn gửi đều 10s/lần dù tab bỏ không.
  useEffect(() => {
    if (bunnyStatus !== 'FINISHED' || initialPosition == null) return;
    if (!track) return; // admin preview: không ghi tracking

    let token: string | null = null;
    let cancelled = false;
    let opening: Promise<void> | null = null;
    // Gửi tuần tự để vị trí xem tiếp không bị lần gửi cũ đến sau ghi đè.
    let chain: Promise<void> = Promise.resolve();

    const position = () =>
      playerReadyRef.current ? Math.round(currentTimeRef.current) : initialPosition;
    const duration = () => {
      const d = Math.round(videoRef.current?.duration ?? NaN);
      return trackerRef.current && Number.isFinite(d) && d > 0 ? d : undefined;
    };

    const open = () =>
      (opening ??= (async () => {
        try {
          const res = await startView(nodeId, position());
          if (!cancelled) token = res.data.trackingToken;
        } catch (err) {
          console.warn('[video-tracking] start failed', err);
        } finally {
          opening = null;
        }
      })());

    const flush = async (final: boolean, keepalive = false) => {
      // Mở lượt xem lỗi (mất mạng lúc vào trang) → thử lại; số liệu vẫn nằm trong tracker.
      if (!token && !final && !cancelled) await open();
      if (!token) return;
      const tracker = trackerRef.current;
      const pending = tracker?.take() ?? { segments: [], watchedSeconds: 0 };
      if (!final && !pending.segments.length && !pending.watchedSeconds) return;
      const payload: BeatPayload = {
        segments: pending.segments,
        watchedSecondsDelta: pending.watchedSeconds,
        currentPositionSec: position(),
        durationSec: duration(),
        final,
      };
      try {
        await sendBeat(token, payload, { keepalive });
      } catch (err) {
        tracker?.restore(pending);
        if (err instanceof TrackingTokenExpiredError && !final) {
          token = null;
          await open();
        } else {
          console.warn('[video-tracking] beat failed', err);
        }
      }
    };
    const queueFlush = () => {
      chain = chain.then(() => flush(false));
    };
    // Lần gửi cuối lúc rời trang phải đi ngay (keepalive), không xếp hàng sau lần khác.
    const flushFinal = () => void flush(true, true);

    void open();
    const intervalId = setInterval(queueFlush, HEARTBEAT_INTERVAL_MS);
    if (trackerRef.current) trackerRef.current.onStop = queueFlush;
    const onHidden = () => {
      if (document.visibilityState === 'hidden') queueFlush();
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flushFinal);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      if (trackerRef.current) trackerRef.current.onStop = null;
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', flushFinal);
      flushFinal();
    };
  }, [nodeId, initialPosition, bunnyStatus, track]);

  const boxClass = cn(
    'bg-muted flex items-center justify-center rounded-lg',
    fill ? 'h-full' : 'aspect-video',
  );

  if (bunnyStatus !== 'FINISHED') {
    return (
      <div className={boxClass}>
        <div className="text-muted-foreground text-center text-sm">
          {bunnyStatus === 'ERROR' ? (
            <>Video xử lý lỗi, vui lòng liên hệ giáo viên.</>
          ) : (
            <>Video đang được xử lý, quay lại sau ít phút.</>
          )}
        </div>
      </div>
    );
  }

  if (initialPosition == null) {
    return (
      <div className={boxClass}>
        <div className="text-muted-foreground text-center text-sm">Đang chuẩn bị player...</div>
      </div>
    );
  }

  const durationFooter = durationSeconds ? (
    <div className="text-muted-foreground bg-background shrink-0 px-3 py-2 text-xs">
      Thời lượng: {formatDuration(durationSeconds)}
      <span className="mx-1.5">·</span>
      Tự lưu &amp; tiếp tục vị trí xem
    </div>
  ) : null;

  // Dự phòng: iframe embed của Bunny (khi hls.js không chạy được).
  if (useIframeFallback) {
    const embedUrl =
      bunnyVideoId && bunnyLibraryId
        ? `https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${bunnyVideoId}?autoplay=false&t=${initialPosition}`
        : `${videoUrl}?autoplay=false&t=${initialPosition}`;
    return (
      <div className={cn('overflow-hidden rounded-lg bg-black', fill && 'flex h-full flex-col')}>
        <div className={cn('relative w-full', fill ? 'min-h-0 flex-1' : 'aspect-video')}>
          <iframe
            src={embedUrl}
            title={title ?? 'Video bài giảng'}
            loading="lazy"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
        {durationFooter}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg bg-black', fill && 'flex h-full flex-col')}>
      <div
        className={cn(
          'w-full',
          // Plyr tự set tỉ lệ theo video; ở chế độ fill ép player lấp đầy chiều cao.
          fill &&
            'min-h-0 flex-1 [&_.plyr]:h-full [&_.plyr\\_\\_video-wrapper]:h-full [&_video]:h-full [&_video]:object-contain',
        )}
      >
        <video
          ref={videoRef}
          playsInline
          preload="metadata"
          title={title ?? 'Video bài giảng'}
          className="w-full bg-black"
        />
      </div>
      {durationFooter}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}
