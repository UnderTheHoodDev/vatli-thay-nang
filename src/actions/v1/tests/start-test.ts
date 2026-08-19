'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { TestAttempt } from '@/types/tests';

export interface StartTestResponse {
  data: TestAttempt | null;
  errors: string[];
}

/**
 * Học sinh bấm "Bắt đầu làm bài" — BE ghi lượt làm và trả hạn nộp cá nhân.
 * Idempotent: bấm lại (refresh, mở tab khác) trả về lượt cũ, KHÔNG reset đồng hồ.
 */
export async function startTestAction(testId: number): Promise<StartTestResponse> {
  try {
    const res = await api.post(`/api/v1/tests/${testId}/start`);
    return { data: (res.data as { data: TestAttempt }).data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Không bắt đầu được bài kiểm tra'] };
  }
}
