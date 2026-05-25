'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { ICreateClassSessionPayload } from '@/types/actions/class-management';

export async function createClassSessionAction(
  classId: number,
  payload: ICreateClassSessionPayload,
): Promise<IActionState> {
  try {
    await api.post(`/api/v1/classes/${classId}/class-sessions`, payload);
    revalidatePath(`/admin/classes/${classId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Tạo buổi học thất bại'] };
  }
}
