'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { AttendanceSummary } from '@/types/actions/attendance';

export interface GetAttendanceSummaryResponse {
  data: AttendanceSummary | null;
  errors: string[];
}

export async function getAttendanceSummary(
  classSessionId: number,
): Promise<GetAttendanceSummaryResponse> {
  try {
    const res = await api.get(`/api/v1/class-sessions/${classSessionId}/attendance-summary`);
    const result = res.data as { data: AttendanceSummary };
    return { data: result.data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Lấy báo cáo điểm danh thất bại'] };
  }
}
