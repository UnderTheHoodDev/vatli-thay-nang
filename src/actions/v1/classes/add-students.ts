'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function addStudentsAction(
  classId: number,
  studentIds: number[],
): Promise<IActionState> {
  try {
    await api.post(`/api/v1/classes/${classId}/students`, { studentIds });
    revalidatePath(`/admin/classes/${classId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Thêm học sinh thất bại'] };
  }
}
