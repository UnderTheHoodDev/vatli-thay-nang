'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IListLeaveRequestsParams,
  IListLeaveRequestsResult,
} from '@/types/actions/leave-requests';

export async function listLeaveRequests(
  classSessionId: number,
  params: IListLeaveRequestsParams,
): Promise<IListLeaveRequestsResult> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get(`/api/v1/class-sessions/${classSessionId}/leave-requests`, {
      params: cleaned,
    });
    const result = res.data as IListLeaveRequestsResult;
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
      errors: ['Lấy danh sách xin nghỉ thất bại'],
    };
  }
}
