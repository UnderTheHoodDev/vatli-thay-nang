'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { ICreateClassGroupPayload } from '@/types/actions/class-management';

export async function createClassGroupAction(
  classId: number,
  payload: ICreateClassGroupPayload,
): Promise<IActionState> {
  try {
    await api.post(`/api/v1/classes/${classId}/groups`, payload);
    revalidatePath(`/admin/classes/${classId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Tạo nhóm thất bại'] };
  }
}
