'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateCourseCategoryPayload } from '@/types/actions/course-management';

export async function updateCourseCategoryAction(
  id: number,
  payload: IUpdateCourseCategoryPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/course-categories/${id}`, payload);
    revalidatePath('/admin/course-categories');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật danh mục thất bại'] };
  }
}
