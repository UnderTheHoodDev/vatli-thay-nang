import { NextRequest, NextResponse } from 'next/server';
import { serverApi } from '@/lib/axios/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const beRes = await serverApi.post('/api/v1/users/activation', body);
  return NextResponse.json(beRes.data, { status: beRes.status });
}
