'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IReorderCourseNodesPayload } from '@/types/actions/course-management';
import type { IActionState } from '@/types/actions/users';

/** Sắp xếp lại thứ tự node trong cùng folder. */
export async function reorderCourseNodesAction(
  courseId: number,
  payload: IReorderCourseNodesPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/courses/${courseId}/nodes/reorder`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Sắp xếp thất bại'] };
  }
}
