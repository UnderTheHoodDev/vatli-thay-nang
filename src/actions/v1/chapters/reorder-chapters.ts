'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IReorderPayload } from '@/types/actions/course-management';

export async function reorderChaptersAction(
  courseId: number,
  payload: IReorderPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/courses/${courseId}/chapters/reorder`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Sắp xếp chương thất bại'] };
  }
}
