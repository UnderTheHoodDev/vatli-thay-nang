'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IGradeSubmissionPayload } from '@/types/actions/tests';
import type { IActionState } from '@/types/actions/users';

/** Chấm điểm + nhận xét. BE từ chối nếu score > maxScore hoặc học sinh chưa nộp bài. */
export async function gradeSubmissionAction(
  courseId: number,
  testId: number,
  studentId: number,
  payload: IGradeSubmissionPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/tests/${testId}/submissions/${studentId}/grade`, payload);
    revalidatePath(`/admin/courses/${courseId}/tests/${testId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Chấm điểm thất bại'] };
  }
}
