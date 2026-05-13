import { NextRequest, NextResponse } from 'next/server';
import { serverApi } from '@/lib/axios/server';
import { clearSessionCookie } from '@/lib/server/cookies';

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const beRes = await serverApi.patch('/api/v1/change-password', body);
  const res = NextResponse.json(beRes.data, { status: beRes.status });
  if (beRes.status >= 200 && beRes.status < 300) {
    clearSessionCookie(res);
  }
  return res;
}
