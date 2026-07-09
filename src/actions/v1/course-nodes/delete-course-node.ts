'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

/** Xoá node (folder cascade + dọn R2/bunny các tệp con). */
export async function deleteCourseNodeAction(
  nodeId: number,
  courseId: number,
): Promise<IActionState> {
  try {
    await api.delete(`/api/v1/nodes/${nodeId}`);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Xoá nội dung thất bại'] };
  }
}
