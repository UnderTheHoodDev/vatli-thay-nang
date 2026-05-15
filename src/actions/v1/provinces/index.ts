'use server';

import { api } from '@/lib/axios';
import type { Province } from '@/types/auth';

export async function listProvinces(): Promise<Province[]> {
  try {
    const res = await api.get('/api/v1/provinces');
    return (res.data as { data: Province[] }).data;
  } catch {
    return [];
  }
}
