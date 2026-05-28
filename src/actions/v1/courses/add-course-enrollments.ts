'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IAddEnrollmentsPayload } from '@/types/actions/course-management';

export async function addCourseEnrollmentsAction(
  courseId: number,
  payload: IAddEnrollmentsPayload,
): Promise<IActionState> {
  try {
    await api.post(`/api/v1/courses/${courseId}/enrollments`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Ghi danh học sinh thất bại'] };
  }
}
