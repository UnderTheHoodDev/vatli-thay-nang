'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateLessonPayload } from '@/types/actions/course-management';

export async function updateLessonAction(
  id: number,
  courseId: number,
  payload: IUpdateLessonPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/lessons/${id}`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật bài học thất bại'] };
  }
}
