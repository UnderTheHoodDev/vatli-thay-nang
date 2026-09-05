'use server';

import { apiClient } from '@/lib/axios';

export async function readPasswordReset(token: string) {
  try {
    const res = await apiClient.get('/api/v1/password/reset', {
      params: { tk: token },
    });
    return res.data as { email: string };
  } catch {
    return null;
  }
}
