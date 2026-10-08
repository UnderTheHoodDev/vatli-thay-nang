// Client helpers cho video tracking.
//
// start / progress đi qua Next Route Handler SAME-ORIGIN (/api/video-tracking/*): cần
// session, mà session_id là cookie httpOnly nên chỉ server đọc được rồi forward
// X-Session-Id sang backend. Mỗi lượt mở video chỉ gọi 1–2 lần.
//
// Heartbeat (mỗi 10s khi đang phát) gửi THẲNG từ trình duyệt tới backend bằng vé theo dõi
// nhận từ /start — không qua Vercel, vì heartbeat chiếm gần hết lượt gọi function và
// từng làm vượt hạn mức gói miễn phí.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_ENDPOINT ??
  'http://localhost:5432';

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
  data: { viewId: number; trackingToken: string };
}

export interface ProgressResult {
  data: {
    totalWatchedSec: number;
    lastPositionSec: number;
    viewCount: number;
    completedViews: number;
    coveragePercent: number;
    lastViewedAt: string | null;
  };
}

export async function startView(nodeId: number, lastPositionSec = 0): Promise<StartViewResult> {
  return postJson<StartViewResult>('start', { nodeId, lastPositionSec });
}

export interface BeatPayload {
  /** Các đoạn nội dung [từ, đến] (giây) đã phát từ lần gửi trước. */
  segments: [number, number][];
  watchedSecondsDelta: number;
  currentPositionSec: number;
  durationSec?: number;
  final?: boolean;
}

export class TrackingTokenExpiredError extends Error {}

/**
 * keepalive: dùng cho lần gửi cuối lúc rời trang, để request vẫn đi khi tab đóng.
 * Ném TrackingTokenExpiredError khi vé hết hạn (401) để trình phát mở lượt mới.
 */
export async function sendBeat(
  token: string,
  payload: BeatPayload,
  opts: { keepalive?: boolean } = {},
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/video-tracking/beat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...payload }),
    keepalive: opts.keepalive,
  });
  if (res.status === 401) throw new TrackingTokenExpiredError();
  if (!res.ok) throw new Error(`tracking beat ${res.status}`);
}

export async function getProgress(nodeId: number): Promise<ProgressResult> {
  const res = await fetch(`/api/video-tracking/progress?nodeId=${nodeId}`, {
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`get-progress ${res.status}`);
  return (await res.json()) as ProgressResult;
}
