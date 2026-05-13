import { NextRequest, NextResponse } from 'next/server';
import { serverApi } from '@/lib/axios/server';
import { setSessionCookie } from '@/lib/server/cookies';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const beRes = await serverApi.post('/api/v1/login', body);
  const res = NextResponse.json(beRes.data, { status: beRes.status });

  const sid = (beRes.data as { session_id?: string })?.session_id;
  if (beRes.status >= 200 && beRes.status < 300 && sid) {
    setSessionCookie(res, sid);
  }

  return res;
}
