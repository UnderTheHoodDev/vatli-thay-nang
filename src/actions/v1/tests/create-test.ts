'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { ICreateTestPayload } from '@/types/actions/tests';
import type { IActionState } from '@/types/actions/users';

export interface CreateTestResult extends IActionState {
  data?: { id: number };
}

export async function createTestAction(
  courseId: number,
  payload: ICreateTestPayload,
): Promise<CreateTestResult> {
  try {
    const res = await api.post(`/api/v1/courses/${courseId}/tests`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    const data = (res.data as { data: { id: number } }).data;
    return { errors: [], data };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Tạo bài kiểm tra thất bại'] };
  }
}
