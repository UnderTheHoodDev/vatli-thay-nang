import { NextRequest, NextResponse } from 'next/server';
import { serverApi } from '@/lib/axios/server';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const beRes = await serverApi.patch(`/api/v1/users/${id}/status`, body);
  return NextResponse.json(beRes.data, { status: beRes.status });
}
