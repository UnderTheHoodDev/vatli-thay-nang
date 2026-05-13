import { NextRequest, NextResponse } from 'next/server';
import { serverApi } from '@/lib/axios/server';

export async function GET(req: NextRequest) {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    params[k] = v;
  });
  const beRes = await serverApi.get('/api/v1/users', { params });
  return NextResponse.json(beRes.data, { status: beRes.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const beRes = await serverApi.post('/api/v1/users', body);
  return NextResponse.json(beRes.data, { status: beRes.status });
}
