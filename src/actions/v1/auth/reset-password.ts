'use server';

import { AxiosError } from 'axios';
import { apiClient } from '@/lib/axios';
import { setSessionCookieInAction } from '@/lib/server/cookies';
import { extractErrors } from '@/lib/errors';
import { roleHomePath } from '@/lib/auth/routes';
import type { Role } from '@/types/auth';
import type { IAuthActionResult } from '@/types/actions/auth';

export async function resetPasswordAction(
  token: string,
  password: string,
  confirmPassword: string,
): Promise<IAuthActionResult> {
  try {
    const res = await apiClient.patch('/api/v1/password/reset', {
      token,
      password,
      confirmPassword,
    });
    const data = res.data as { session_id?: string; role?: Role };
    if (!data?.session_id || !data?.role) {
      return { success: false, errors: ['Đặt lại mật khẩu thất bại'] };
    }
    await setSessionCookieInAction(data.session_id);

    return { success: true, errors: [], redirectTo: roleHomePath(data.role) };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { success: false, errors: extractErrors(error.response.data) };
    }
    return { success: false, errors: ['Đặt lại mật khẩu thất bại'] };
  }
}
