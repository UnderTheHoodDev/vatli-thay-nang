'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { ICreateLessonItemPayload } from '@/types/actions/course-management';

export interface CreateLessonItemResponse {
  data: { id: number } | null;
  errors: string[];
}

export async function createLessonItemAction(
  lessonId: number,
  courseId: number,
  payload: ICreateLessonItemPayload,
): Promise<CreateLessonItemResponse> {
  try {
    const res = await api.post(
      `/api/v1/lessons/${lessonId}/lesson-items`,
      payload,
    );
    const id = (res.data as { data?: { id: number } }).data?.id ?? null;
    revalidatePath(`/admin/courses/${courseId}`);
    return { data: id != null ? { id } : null, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Tạo mục bài học thất bại'] };
  }
}
