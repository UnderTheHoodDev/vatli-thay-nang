'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { ICreateLessonPayload } from '@/types/actions/course-management';

export async function createLessonAction(
  chapterId: number,
  courseId: number,
  payload: ICreateLessonPayload,
): Promise<IActionState> {
  try {
    await api.post(`/api/v1/chapters/${chapterId}/lessons`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Tạo bài học thất bại'] };
  }
}
