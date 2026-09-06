'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';

export interface ResetUserPasswordState {
  errors: string[];
  password?: string;
}

export async function resetUserPasswordAction(id: number): Promise<ResetUserPasswordState> {
  try {
    const res = await api.patch(`/api/v1/users/${id}/reset-password`);
    revalidatePath('/admin/accounts');
    return { errors: [], password: (res.data as { data?: { password?: string } })?.data?.password };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Đặt lại mật khẩu thất bại'] };
  }
}
