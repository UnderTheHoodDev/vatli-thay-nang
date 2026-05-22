'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IListClassStudentsParams,
  IListClassStudentsResult,
} from '@/types/actions/class-management';

export interface ListClassStudentsResponse {
  data: IListClassStudentsResult['data'];
  meta: IListClassStudentsResult['meta'];
  errors: string[];
}

export async function listClassStudents(
  classId: number,
  params: IListClassStudentsParams,
): Promise<ListClassStudentsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get(`/api/v1/classes/${classId}/students`, {
      params: cleaned,
    });
    const result = res.data as IListClassStudentsResult;
    return { data: result.data, meta: result.meta, errors: [] };
  } catch (error) {
    const emptyMeta = {
      total: 0,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    };
    if (error instanceof AxiosError && error.response?.data) {
      return {
        data: [],
        meta: emptyMeta,
        errors: extractErrors(error.response.data),
      };
    }
    return {
      data: [],
      meta: emptyMeta,
      errors: ['Lấy danh sách học sinh trong lớp thất bại'],
    };
  }
}
