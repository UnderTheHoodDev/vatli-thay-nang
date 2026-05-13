import { NextResponse } from 'next/server';
import { serverApi } from '@/lib/axios/server';

export async function GET() {
  const beRes = await serverApi.get('/api/v1/provinces');
  return NextResponse.json(beRes.data, { status: beRes.status });
}
