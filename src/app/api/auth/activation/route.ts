import { NextRequest, NextResponse } from 'next/server';
import { serverApi } from '@/lib/axios/server';
import { setSessionCookie } from '@/lib/server/cookies';

export async function GET(req: NextRequest) {
  const tk = req.nextUrl.searchParams.get('tk') ?? '';
  const beRes = await serverApi.get('/api/v1/users/activation', {
    params: { tk },
  });
  return NextResponse.json(beRes.data, { status: beRes.status });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const beRes = await serverApi.patch('/api/v1/users/activation', body);
  const res = NextResponse.json(beRes.data, { status: beRes.status });

  const sid = (beRes.data as { session_id?: string })?.session_id;
  if (beRes.status >= 200 && beRes.status < 300 && sid) {
    setSessionCookie(res, sid);
  }
  return res;
}
