'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

/** Mở lại bài cho học sinh CHƯA nộp, tới mốc `reopenUntil` (ISO 8601). */
export async function reopenSubmissionAction(
  courseId: number,
  testId: number,
  studentId: number,
  payload: { reopenUntil: string; reason?: string },
): Promise<IActionState> {
  try {
    await api.post(`/api/v1/tests/${testId}/submissions/${studentId}/reopen`, payload);
    revalidatePath(`/admin/courses/${courseId}/tests/${testId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Mở lại bài thất bại'] };
  }
}

export async function cancelReopenSubmissionAction(
  courseId: number,
  testId: number,
  studentId: number,
): Promise<IActionState> {
  try {
    await api.delete(`/api/v1/tests/${testId}/submissions/${studentId}/reopen`);
    revalidatePath(`/admin/courses/${courseId}/tests/${testId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Huỷ mở lại bài thất bại'] };
  }
}
