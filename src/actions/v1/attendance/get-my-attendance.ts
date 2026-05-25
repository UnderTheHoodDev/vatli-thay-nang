'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { MyAttendanceLog } from '@/types/actions/attendance';

export interface GetMyAttendanceResponse {
  data: MyAttendanceLog[];
  errors: string[];
}

export async function getMyAttendance(classSessionId: number): Promise<GetMyAttendanceResponse> {
  try {
    const res = await api.get(`/api/v1/class-sessions/${classSessionId}/my-attendance`);
    const result = res.data as { data: MyAttendanceLog[] };
    return { data: result.data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: [], errors: extractErrors(error.response.data) };
    }
    return { data: [], errors: ['Lấy lịch sử điểm danh thất bại'] };
  }
}
