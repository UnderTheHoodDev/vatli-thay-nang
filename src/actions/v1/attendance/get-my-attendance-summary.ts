'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { ClassAttendanceCounts } from '@/types/actions/attendance';

export interface GetMyAttendanceSummaryResponse {
  data: ClassAttendanceCounts | null;
  errors: string[];
}

export async function getMyAttendanceSummary(
  classId: number,
): Promise<GetMyAttendanceSummaryResponse> {
  try {
    const res = await api.get('/api/v1/attendance/summary/me', { params: { classId } });
    const result = res.data as { data: ClassAttendanceCounts };
    return { data: result.data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Lấy thống kê chuyên cần thất bại'] };
  }
}
