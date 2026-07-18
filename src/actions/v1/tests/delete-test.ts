'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

/** Xoá bài kiểm tra: BE cascade xoá đề + bài nộp + file, và dọn object trên R2. */
export async function deleteTestAction(courseId: number, testId: number): Promise<IActionState> {
  try {
    await api.delete(`/api/v1/tests/${testId}`);
    revalidatePath(`/admin/courses/${courseId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Xoá bài kiểm tra thất bại'] };
  }
}
