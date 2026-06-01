'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function deleteCourseCategoryAction(id: number): Promise<IActionState> {
  try {
    await api.delete(`/api/v1/course-categories/${id}`);
    revalidatePath('/admin/courses/categories');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Xoá danh mục thất bại'] };
  }
}
