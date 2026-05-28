'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateCoursePayload } from '@/types/actions/course-management';

export async function updateCourseAction(
  id: number,
  payload: IUpdateCoursePayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/courses/${id}`, payload);
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${id}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật khóa học thất bại'] };
  }
}
