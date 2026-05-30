'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

/** Báo BE đã upload xong bytes video (UPLOADING → QUEUED). */
export async function markUploadedAction(
  lessonItemId: number,
  courseId: number,
): Promise<IActionState> {
  try {
    await api.post(`/api/v1/lesson-items/${lessonItemId}/mark-uploaded`);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Đánh dấu upload hoàn tất thất bại'] };
  }
}
