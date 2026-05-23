'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IListAttendanceSessionsParams,
  IListAttendanceSessionsResult,
} from '@/types/actions/attendance';

export interface ListAttendanceSessionsResponse {
  data: IListAttendanceSessionsResult['data'];
  meta: IListAttendanceSessionsResult['meta'];
  errors: string[];
}

export async function listAttendanceSessions(
  classSessionId: number,
  params: IListAttendanceSessionsParams,
): Promise<ListAttendanceSessionsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== '' && v !== undefined && v !== null,
    ),
  );
  try {
    const res = await api.get(
      `/api/v1/class-sessions/${classSessionId}/attendance-sessions`,
      { params: cleaned },
    );
    const result = res.data as IListAttendanceSessionsResult;
    return { data: result.data, meta: result.meta, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return {
        data: [],
        meta: { total: 0, page: 1, pageSize: 20 },
        errors: extractErrors(error.response.data),
      };
    }
    return {
      data: [],
      meta: { total: 0, page: 1, pageSize: 20 },
      errors: ['Lấy danh sách phiên điểm danh thất bại'],
    };
  }
}
