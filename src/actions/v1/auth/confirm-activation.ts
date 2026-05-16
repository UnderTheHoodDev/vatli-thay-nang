'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { setSessionCookieInAction } from '@/lib/server/cookies';
import { extractErrors } from '@/lib/errors';
import type { IConfirmActivationResult } from '@/types/actions/auth';

export async function confirmActivationAction(token: string): Promise<IConfirmActivationResult> {
  try {
    const res = await api.patch('/api/v1/users/activation', { token });
    const data = res.data as { session_id: string };
    if (!data?.session_id) {
      return { success: false, errors: ['Kích hoạt thất bại'] };
    }
    await setSessionCookieInAction(data.session_id);
    return {
      success: true,
      errors: [],
      redirectTo: '/auth/change-password',
    };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { success: false, errors: extractErrors(error.response.data) };
    }
    return { success: false, errors: ['Kích hoạt thất bại'] };
  }
}
