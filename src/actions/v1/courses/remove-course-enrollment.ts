'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function removeCourseEnrollmentAction(
  courseId: number,
  studentId: number,
): Promise<IActionState> {
  try {
    await api.delete(`/api/v1/courses/${courseId}/enrollments/${studentId}`);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Thu hồi enrollment thất bại'] };
  }
}
