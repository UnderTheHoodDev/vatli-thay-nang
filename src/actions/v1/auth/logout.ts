'use server';

import { api } from '@/lib/axios';
import { clearSessionCookieInAction } from '@/lib/server/cookies';
import type { ILogoutActionResult } from '@/types/actions/auth';

export async function logoutAction(): Promise<ILogoutActionResult> {
  try {
    await api.post('/api/v1/logout', {});
  } catch (error) {
    console.error('Logout API call failed; clearing client session anyway', error);
  }

  await clearSessionCookieInAction();
  return { success: true, errors: [], redirectTo: '/auth/login' };
}
