'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { ICreateCoursePayload } from '@/types/actions/course-management';

export interface CreateCourseResult extends IActionState {
  data?: { id: number };
}

export async function createCourseAction(
  payload: ICreateCoursePayload,
): Promise<CreateCourseResult> {
  try {
    const res = await api.post('/api/v1/courses', payload);
    revalidatePath('/admin/courses');
    const data = (res.data as { data: { id: number } }).data;
    return { errors: [], data };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Tạo khóa học thất bại'] };
  }
}
