import api from '@/lib/axios';
import type { Province } from '@/types/auth';

export async function listProvinces() {
  const { data } = await api.get<{ data: Province[] }>('/provinces');
  return data.data;
}
