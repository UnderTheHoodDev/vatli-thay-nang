'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IUpdateTestPayload } from '@/types/actions/tests';
import type { IActionState } from '@/types/actions/users';

/**
 * Sửa bài kiểm tra — được cả khi đang mở (gia hạn lịch, thay đề).
 *
 * `attachments` là danh sách ĐẦY ĐỦ mới: BE diff với DB để xoá file bị bỏ khỏi R2.
 * BE từ chối (400) nếu hạ maxScore xuống dưới điểm đã chấm của một bài nào đó.
 */
export async function updateTestAction(
  courseId: number,
  testId: number,
  payload: IUpdateTestPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/tests/${testId}`, payload);
    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath(`/admin/courses/${courseId}/tests/${testId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật bài kiểm tra thất bại'] };
  }
}
