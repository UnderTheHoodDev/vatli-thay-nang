'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function restoreStudentAction(
  classId: number,
  studentId: number,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/classes/${classId}/students/${studentId}/restore`, {});
    revalidatePath(`/admin/classes/${classId}`);
    revalidatePath(`/admin/tuition/${classId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Khôi phục trạng thái thất bại'] };
  }
}
