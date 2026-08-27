'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateClassGroupPayload } from '@/types/actions/class-management';

export async function updateClassGroupAction(
  classId: number,
  groupId: number,
  payload: IUpdateClassGroupPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/classes/${classId}/groups/${groupId}`, payload);
    revalidatePath(`/admin/classes/${classId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật nhóm thất bại'] };
  }
}
