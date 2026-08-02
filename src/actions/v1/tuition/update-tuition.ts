'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateTuitionPayload } from '@/types/actions/tuition';

export async function updateTuitionAction(
  id: number,
  classId: number,
  payload: IUpdateTuitionPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/tuition/${id}`, payload);
    revalidatePath(`/admin/tuition/${classId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật học phí thất bại'] };
  }
}
