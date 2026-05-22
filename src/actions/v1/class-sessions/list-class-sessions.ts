'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IListClassSessionsParams,
  IListClassSessionsResult,
} from '@/types/actions/class-management';

export interface ListClassSessionsResponse {
  data: IListClassSessionsResult['data'];
  meta: IListClassSessionsResult['meta'];
  errors: string[];
}

export async function listClassSessions(
  classId: number,
  params: IListClassSessionsParams,
): Promise<ListClassSessionsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get(`/api/v1/classes/${classId}/class-sessions`, { params: cleaned });
    const result = res.data as IListClassSessionsResult;
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
      errors: ['Lấy danh sách buổi học thất bại'],
    };
  }
}
