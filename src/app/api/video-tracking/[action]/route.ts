import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Proxy same-origin cho video tracking. session_id là httpOnly → client JS không
// đọc được; thay vào đó client gọi các route này (same-origin nên browser tự gửi
// cookie), route đọc cookie server-side rồi forward X-Session-Id sang backend.

const API =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_ENDPOINT ??
  'http://localhost:8082';

const POST_ACTIONS = new Set(['start', 'heartbeat', 'end']);

async function getSid(): Promise<string | undefined> {
  return (await cookies()).get('session_id')?.value;
}

function passthrough(text: string, status: number, contentType?: string | null) {
  return new NextResponse(text, {
    status,
    headers: { 'Content-Type': contentType ?? 'application/json' },
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> },
) {
  const { action } = await ctx.params;
  if (!POST_ACTIONS.has(action)) {
    return NextResponse.json({ errors: ['Not found'] }, { status: 404 });
  }
  const sid = await getSid();
  if (!sid) {
    return NextResponse.json({ errors: ['Chưa đăng nhập'] }, { status: 401 });
  }
  const body = await req.text();
  const res = await fetch(`${API}/api/v1/video-tracking/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': sid },
    body,
  });
  return passthrough(await res.text(), res.status, res.headers.get('content-type'));
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> },
) {
  const { action } = await ctx.params;
  if (action !== 'progress') {
    return NextResponse.json({ errors: ['Not found'] }, { status: 404 });
  }
  const sid = await getSid();
  if (!sid) {
    return NextResponse.json({ errors: ['Chưa đăng nhập'] }, { status: 401 });
  }
  const lessonItemId = req.nextUrl.searchParams.get('lessonItemId') ?? '';
  const res = await fetch(
    `${API}/api/v1/video-tracking/progress?lessonItemId=${encodeURIComponent(lessonItemId)}`,
    { headers: { 'X-Session-Id': sid } },
  );
  return passthrough(await res.text(), res.status, res.headers.get('content-type'));
}
