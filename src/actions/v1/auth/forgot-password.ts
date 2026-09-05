'use server';

import { AxiosError } from 'axios';
import { apiClient } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function forgotPasswordAction(email: string): Promise<IActionState> {
  try {
    await apiClient.post('/api/v1/password/forgot', { email });
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Gửi email đặt lại mật khẩu thất bại'] };
  }
}
