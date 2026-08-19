'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState, IAdminUpdateUserPayload } from '@/types/actions/users';

export async function adminUpdateUserAction(
  id: number,
  payload: IAdminUpdateUserPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/users/${id}`, payload);
    revalidatePath('/admin/accounts');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật thông tin thất bại'] };
  }
}
