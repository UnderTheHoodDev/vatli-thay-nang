'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IUpdateProfilePayload, IUpdateProfileResult } from '@/types/actions/profile';

export async function updateProfileAction(
  payload: IUpdateProfilePayload,
): Promise<IUpdateProfileResult> {
  try {
    await api.patch('/api/v1/users/profile', payload);
    revalidatePath('/admin/profile');
    revalidatePath('/dashboard/profile');
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { success: false, errors: extractErrors(error.response.data) };
    }
    return {
      success: false,
      errors: ['Cập nhật thông tin cá nhân thất bại'],
    };
  }
}
