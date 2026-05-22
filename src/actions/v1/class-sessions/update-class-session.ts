'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateClassSessionPayload } from '@/types/actions/class-management';

export async function updateClassSessionAction(
  id: number,
  classId: number,
  payload: IUpdateClassSessionPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/class-sessions/${id}`, payload);
    revalidatePath(`/admin/classes/${classId}/class-sessions`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật buổi học thất bại'] };
  }
}
