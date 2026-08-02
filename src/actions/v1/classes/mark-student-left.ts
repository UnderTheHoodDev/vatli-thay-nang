'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { ILeaveClassStudentPayload } from '@/types/actions/class-management';

export async function markStudentLeftAction(
  classId: number,
  studentId: number,
  payload: ILeaveClassStudentPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/classes/${classId}/students/${studentId}/leave`, payload);
    revalidatePath(`/admin/classes/${classId}`);
    revalidatePath(`/admin/tuition/${classId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Đánh dấu nghỉ học thất bại'] };
  }
}
