import { NextResponse } from 'next/server';
import { serverApi } from '@/lib/axios/server';
import { clearSessionCookie } from '@/lib/server/cookies';

export async function POST() {
  const beRes = await serverApi.post('/api/v1/logout', {});
  const res = NextResponse.json(beRes.data, { status: beRes.status });
  if (beRes.status >= 200 && beRes.status < 300) {
    clearSessionCookie(res);
  }
  return res;
}
