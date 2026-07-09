'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IUpdateCourseNodePayload } from '@/types/actions/course-management';
import type { IActionState } from '@/types/actions/users';

/** Đổi tên / thay tệp của node. */
export async function updateCourseNodeAction(
  nodeId: number,
  courseId: number,
  payload: IUpdateCourseNodePayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/nodes/${nodeId}`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật nội dung thất bại'] };
  }
}
