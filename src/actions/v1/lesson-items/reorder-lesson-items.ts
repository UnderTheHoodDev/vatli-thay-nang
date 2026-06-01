'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IReorderPayload } from '@/types/actions/course-management';

export async function reorderLessonItemsAction(
  lessonId: number,
  courseId: number,
  payload: IReorderPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/lessons/${lessonId}/lesson-items/reorder`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Sắp xếp mục bài học thất bại'] };
  }
}
