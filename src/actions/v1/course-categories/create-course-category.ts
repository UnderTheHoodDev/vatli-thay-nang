'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { ICreateCourseCategoryPayload } from '@/types/actions/course-management';

export async function createCourseCategoryAction(
  payload: ICreateCourseCategoryPayload,
): Promise<IActionState> {
  try {
    await api.post('/api/v1/course-categories', payload);
    revalidatePath('/admin/courses/categories');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Tạo danh mục thất bại'] };
  }
}
