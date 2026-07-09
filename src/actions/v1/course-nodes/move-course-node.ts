'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IMoveCourseNodePayload } from '@/types/actions/course-management';
import type { IActionState } from '@/types/actions/users';

/** Kéo-thả node sang folder khác (đổi parent). */
export async function moveCourseNodeAction(
  nodeId: number,
  courseId: number,
  payload: IMoveCourseNodePayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/nodes/${nodeId}/move`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Di chuyển thất bại'] };
  }
}
