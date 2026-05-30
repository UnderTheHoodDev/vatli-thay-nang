'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function deleteCourseAction(id: number): Promise<IActionState> {
  try {
    await api.delete(`/api/v1/courses/${id}`);
    revalidatePath('/admin/courses');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Xoá khóa học thất bại'] };
  }
}
