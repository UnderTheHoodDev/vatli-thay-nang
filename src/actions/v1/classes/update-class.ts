'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateClassPayload } from '@/types/actions/class-management';

export async function updateClassAction(id: number, payload: IUpdateClassPayload): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/classes/${id}`, payload);
    revalidatePath('/admin/classes');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật lớp thất bại'] };
  }
}
