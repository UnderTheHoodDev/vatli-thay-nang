'use client';

import { useEffect, useRef, useState } from 'react';
import { endView, getProgress, heartbeat, startView } from '@/lib/video-tracking-client';
import { loadPlayerJs, type BunnyPlayer } from '@/lib/bunny-player';
import type { BunnyVideoStatus } from '@/types/course-management';

interface Props {
  nodeId: number;
  videoUrl: string;
  durationSeconds?: number | null;
  bunnyStatus: BunnyVideoStatus;
  title?: string;
}

const HEARTBEAT_INTERVAL_MS = 10_000;
const MAX_DELTA_SEC = 60;

export default function VideoPlayer({
  nodeId,
  videoUrl,
  durationSeconds,
  bunnyStatus,
  title,
}: Props) {
  const [initialPosition, setInitialPosition] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const viewIdRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  // Trạng thái từ Player.js (vị trí + đang phát) — nguồn vị trí THẬT.
  const playerReadyRef = useRef(false);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);

  // Lấy vị trí resume trước khi mount iframe.
  useEffect(() => {
    if (bunnyStatus !== 'FINISHED') return;
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
  }, [nodeId, bunnyStatus]);

  // Player.js: seek tới vị trí dở + lắng nghe vị trí thật. Fallback im lặng nếu
  // script không tải được (adblock) — khi đó dùng cơ chế ?t= + accumulated.
  useEffect(() => {
    if (bunnyStatus !== 'FINISHED' || initialPosition == null) return;
    currentTimeRef.current = initialPosition; // tránh ghi 0 trước khi có timeupdate

    let cancelled = false;
    let player: BunnyPlayer | null = null;

    loadPlayerJs()
      .then((pjs) => {
        if (cancelled || !iframeRef.current) return;
        player = new pjs.Player(iframeRef.current);
        player.on('ready', () => {
          if (cancelled || !player) return;
          playerReadyRef.current = true;
          try {
            player.setCurrentTime(initialPosition); // seek đáng tin (thay ?t=)
          } catch {
            /* noop */
          }
          player.on('timeupdate', ({ seconds }) => {
            currentTimeRef.current = seconds;
          });
          player.on('play', () => {
            isPlayingRef.current = true;
          });
          player.on('pause', () => {
            isPlayingRef.current = false;
          });
          player.on('ended', () => {
            isPlayingRef.current = false;
          });
        });
      })
      .catch((e) => {
        console.warn('[video] Player.js không tải được, dùng fallback', e);
      });

    return () => {
      cancelled = true;
      playerReadyRef.current = false;
      isPlayingRef.current = false;
    };
  }, [initialPosition, bunnyStatus, nodeId]);

  // Tracking lifecycle (start / heartbeat / end).
  useEffect(() => {
    if (bunnyStatus !== 'FINISHED' || initialPosition == null) return;

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
            // Vị trí thật từ player; chỉ cộng "đã xem" khi đang phát.
            watchedDelta = isPlayingRef.current ? elapsed : 0;
          } else {
            // Fallback: ước lượng bằng thời gian trôi (bỏ qua khi tab ẩn).
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
  }, [nodeId, initialPosition, bunnyStatus]);

  if (bunnyStatus !== 'FINISHED') {
    return (
      <div className="bg-muted flex aspect-video items-center justify-center rounded-lg">
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
      <div className="bg-muted flex aspect-video items-center justify-center rounded-lg">
        <div className="text-muted-foreground text-center text-sm">Đang chuẩn bị player...</div>
      </div>
    );
  }

  // Giữ &t= làm hint cho fallback (Player.js setCurrentTime là cơ chế chính).
  const src = `${videoUrl}?autoplay=false&t=${initialPosition}`;
  return (
    <div className="overflow-hidden rounded-lg bg-black">
      <div className="relative aspect-video w-full">
        <iframe
          ref={iframeRef}
          src={src}
          title={title ?? 'Video bài giảng'}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      {durationSeconds ? (
        <div className="text-muted-foreground bg-background px-3 py-2 text-xs">
          Thời lượng: {formatDuration(durationSeconds)} · Tự lưu &amp; tiếp tục vị trí xem
        </div>
      ) : null}
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
