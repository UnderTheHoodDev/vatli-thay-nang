'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';
import { endView, getProgress, heartbeat, startView } from '@/lib/video-tracking-client';
import { cn } from '@/lib/utils';
import type { BunnyVideoStatus } from '@/types/course-management';

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
const MAX_DELTA_SEC = 60;
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

  const viewIdRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  // Vị trí + trạng thái phát THẬT (từ <video>). Khi fallback iframe, các ref này
  // không cập nhật → tracking tự dùng cơ chế ước lượng (accumulated).
  const playerReadyRef = useRef(false);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);

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
    const onPlay = () => {
      isPlayingRef.current = true;
    };
    const onPauseOrEnd = () => {
      isPlayingRef.current = false;
    };
    video.addEventListener('loadedmetadata', onLoadedMeta);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPauseOrEnd);
    video.addEventListener('ended', onPauseOrEnd);

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
      isPlayingRef.current = false;
      video.removeEventListener('loadedmetadata', onLoadedMeta);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPauseOrEnd);
      video.removeEventListener('ended', onPauseOrEnd);
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

  // Tracking lifecycle (start / heartbeat / end). Không phụ thuộc cơ chế phát.
  useEffect(() => {
    if (bunnyStatus !== 'FINISHED' || initialPosition == null) return;
    if (!track) return; // admin preview: không ghi tracking

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const currentPos = () =>
      playerReadyRef.current
        ? Math.round(currentTimeRef.current)
        : initialPosition + accumulatedRef.current;

    const begin = async () => {
      try {
        const res = await startView(nodeId, initialPosition);
        if (cancelled) return;
        viewIdRef.current = res.data.viewId;
        lastTickRef.current = Date.now();
        accumulatedRef.current = 0;

        intervalId = setInterval(async () => {
          const now = Date.now();
          const elapsed = Math.min(
            MAX_DELTA_SEC,
            Math.max(0, Math.round((now - lastTickRef.current) / 1000)),
          );
          lastTickRef.current = now;

          let watchedDelta: number;
          if (playerReadyRef.current) {
            watchedDelta = isPlayingRef.current ? elapsed : 0;
          } else {
            watchedDelta = document.hidden ? 0 : elapsed;
            accumulatedRef.current += watchedDelta;
          }

          if (viewIdRef.current == null) return;
          try {
            const hb = await heartbeat(viewIdRef.current, watchedDelta, currentPos());
            if (hb.data.newViewId) viewIdRef.current = hb.data.newViewId;
          } catch (err) {
            console.warn('[video-tracking] heartbeat failed', err);
          }
        }, HEARTBEAT_INTERVAL_MS);
      } catch (err) {
        console.warn('[video-tracking] start failed', err);
      }
    };

    const onBeforeUnload = () => {
      if (viewIdRef.current != null) endView(viewIdRef.current, currentPos());
    };
    window.addEventListener('pagehide', onBeforeUnload);

    void begin();

    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', onBeforeUnload);
      if (intervalId) clearInterval(intervalId);
      if (viewIdRef.current != null) {
        endView(viewIdRef.current, currentPos());
        viewIdRef.current = null;
      }
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
