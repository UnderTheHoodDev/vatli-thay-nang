'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { ICreateCourseNodePayload } from '@/types/actions/course-management';

export interface CreateCourseNodeResponse {
  data: { id: number } | null;
  errors: string[];
}

/** Tạo folder hoặc tệp (video/tài liệu) trong khóa học. */
export async function createCourseNodeAction(
  courseId: number,
  payload: ICreateCourseNodePayload,
): Promise<CreateCourseNodeResponse> {
  try {
    const res = await api.post(`/api/v1/courses/${courseId}/nodes`, payload);
    const id = (res.data as { data?: { id: number } }).data?.id ?? null;
    revalidatePath(`/admin/courses/${courseId}`);
    return { data: id != null ? { id } : null, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Tạo nội dung thất bại'] };
  }
}
