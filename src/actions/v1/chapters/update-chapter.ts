'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateChapterPayload } from '@/types/actions/course-management';

export async function updateChapterAction(
  id: number,
  courseId: number,
  payload: IUpdateChapterPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/chapters/${id}`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật chương thất bại'] };
  }
}
