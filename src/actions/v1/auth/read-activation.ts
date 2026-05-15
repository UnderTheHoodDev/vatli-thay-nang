'use server';

import { api } from '@/lib/axios';

export async function readActivation(token: string) {
  try {
    const res = await api.get('/api/v1/users/activation', {
      params: { tk: token },
    });
    return res.data as {
      userId: number;
      email: string;
      role: string;
      expiredAt: number;
    };
  } catch {
    return null;
  }
}
