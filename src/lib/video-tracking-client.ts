// Client helpers cho video tracking. Gọi các Next Route Handler SAME-ORIGIN
// (/api/video-tracking/*) — browser tự gửi cookie httpOnly session_id tới đó,
// route đọc cookie + forward X-Session-Id sang backend. KHÔNG đọc document.cookie
// (session_id là httpOnly nên không truy cập được từ JS).

async function postJson<T>(action: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/video-tracking/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`tracking ${action} ${res.status}: ${err}`);
  }
  return (await res.json()) as T;
}

export interface StartViewResult {
  data: { viewId: number };
}

export interface HeartbeatResult {
  data: { newViewId?: number; idle: boolean };
}

export interface ProgressResult {
  data: {
    totalWatchedSec: number;
    lastPositionSec: number;
    viewCount: number;
    lastViewedAt: string | null;
  };
}

export async function startView(nodeId: number, lastPositionSec = 0): Promise<StartViewResult> {
  return postJson<StartViewResult>('start', { nodeId, lastPositionSec });
}

export async function heartbeat(
  viewId: number,
  watchedSecondsDelta: number,
  currentPositionSec: number,
): Promise<HeartbeatResult> {
  return postJson<HeartbeatResult>('heartbeat', {
    viewId,
    watchedSecondsDelta,
    currentPositionSec,
  });
}

export function endView(viewId: number, currentPositionSec: number): void {
  // keepalive để request sống sót khi đóng tab. Same-origin → cookie tự gửi.
  void fetch('/api/video-tracking/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ viewId, currentPositionSec }),
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => undefined);
}

export async function getProgress(nodeId: number): Promise<ProgressResult> {
  const res = await fetch(`/api/video-tracking/progress?nodeId=${nodeId}`, {
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`get-progress ${res.status}`);
  return (await res.json()) as ProgressResult;
}
