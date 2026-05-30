// Loader cho bunny.net Player.js — điều khiển iframe Stream player (seek, events).
// Tài liệu: https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js

const PLAYER_JS_SRC =
  'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js';

interface PlayerJsStatic {
  Player: new (el: HTMLIFrameElement | string) => BunnyPlayer;
}

export interface BunnyPlayer {
  on(event: 'ready', cb: () => void): void;
  on(event: 'play' | 'pause' | 'ended', cb: () => void): void;
  on(event: 'timeupdate', cb: (data: { seconds: number; duration: number }) => void): void;
  setCurrentTime(seconds: number): void;
  getCurrentTime(cb: (seconds: number) => void): void;
  off?(event: string): void;
}

declare global {
  interface Window {
    playerjs?: PlayerJsStatic;
  }
}

let loadPromise: Promise<PlayerJsStatic> | null = null;

/**
 * Load Player.js 1 lần, cache promise. Reject nếu không tải được (adblock/mạng)
 * để caller fallback sang cơ chế khác.
 */
export function loadPlayerJs(): Promise<PlayerJsStatic> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Player.js chỉ chạy ở client'));
  }
  if (window.playerjs) return Promise.resolve(window.playerjs);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<PlayerJsStatic>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PLAYER_JS_SRC}"]`,
    );
    const onReady = () => {
      if (window.playerjs) resolve(window.playerjs);
      else reject(new Error('playerjs không khả dụng sau khi load'));
    };
    if (existing) {
      if (window.playerjs) resolve(window.playerjs);
      else existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', () => reject(new Error('Lỗi tải Player.js')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = PLAYER_JS_SRC;
    script.async = true;
    script.addEventListener('load', onReady, { once: true });
    script.addEventListener('error', () => {
      loadPromise = null; // cho phép thử lại lần sau
      reject(new Error('Lỗi tải Player.js'));
    }, { once: true });
    document.head.appendChild(script);
  });
  return loadPromise;
}
