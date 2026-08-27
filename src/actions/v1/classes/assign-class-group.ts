'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IAssignClassGroupPayload } from '@/types/actions/class-management';

export async function assignClassGroupAction(
  classId: number,
  payload: IAssignClassGroupPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/classes/${classId}/students/group`, payload);
    revalidatePath(`/admin/classes/${classId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật nhóm thất bại'] };
  }
}
