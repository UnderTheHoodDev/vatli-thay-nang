'use server';

import { AxiosError } from 'axios';
import { apiClient } from '@/lib/axios';
import { setSessionCookieInAction } from '@/lib/server/cookies';
import { extractErrors } from '@/lib/errors';
import type { Role } from '@/types/auth';
import type { IAuthActionResult } from '@/types/actions/auth';

export async function loginAction(email: string, password: string): Promise<IAuthActionResult> {
  const trimmedEmail = email.trim();

  try {
    const res = await apiClient.post('/api/v1/login', { email: trimmedEmail, password });
    const data = res.data as { session_id: string; role: Role };
    await setSessionCookieInAction(data.session_id);

    return {
      success: true,
      errors: [],
      redirectTo: data.role === 'ADMIN' ? '/admin/accounts' : '/dashboard',
    };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { success: false, errors: extractErrors(error.response.data) };
    }
    return { success: false, errors: ['Đăng nhập thất bại'] };
  }
}
