'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateEnrollmentDatePayload } from '@/types/actions/class-management';

export async function updateEnrollmentDateAction(
  classId: number,
  studentId: number,
  payload: IUpdateEnrollmentDatePayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/classes/${classId}/students/${studentId}`, payload);
    revalidatePath(`/admin/classes/${classId}`);
    revalidatePath(`/admin/tuition/${classId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật ngày vào học thất bại'] };
  }
}
