'use server';

import { api } from '@/lib/axios';
import type { IUserProfile } from '@/types/actions/profile';

export async function getProfileAction(): Promise<IUserProfile | null> {
  try {
    const res = await api.get('/api/v1/users/profile');
    return res.data as IUserProfile;
  } catch {
    return null;
  }
}
