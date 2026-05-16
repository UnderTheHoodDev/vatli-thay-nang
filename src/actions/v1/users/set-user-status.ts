'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { UserStatus } from '@/types/auth';
import type { IActionState } from '@/types/actions/users';

export async function setUserStatusAction(id: number, status: UserStatus): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/users/${id}/status`, { status });
    revalidatePath('/admin/users');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật trạng thái thất bại'] };
  }
}
