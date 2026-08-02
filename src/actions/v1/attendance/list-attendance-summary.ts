'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { ClassAttendanceStudentRow } from '@/types/actions/attendance';

export interface ListAttendanceSummaryResponse {
  data: ClassAttendanceStudentRow[];
  errors: string[];
}

export async function listAttendanceSummary(classId: number): Promise<ListAttendanceSummaryResponse> {
  try {
    const res = await api.get('/api/v1/attendance/summary', { params: { classId } });
    const result = res.data as { data: ClassAttendanceStudentRow[] };
    return { data: result.data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: [], errors: extractErrors(error.response.data) };
    }
    return { data: [], errors: ['Lấy thống kê chuyên cần thất bại'] };
  }
}
