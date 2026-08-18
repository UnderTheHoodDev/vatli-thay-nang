'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function deleteUserAction(id: number): Promise<IActionState> {
  try {
    await api.delete(`/api/v1/users/${id}`);
    revalidatePath('/admin/accounts');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Xoá tài khoản thất bại'] };
  }
}
