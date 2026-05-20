'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IListClassesParams, IListClassesResult } from '@/types/actions/class-management';

export interface ListClassesResponse {
  data: IListClassesResult['data'];
  meta: IListClassesResult['meta'];
  errors: string[];
}

export async function listClasses(params: IListClassesParams): Promise<ListClassesResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get('/api/v1/classes', { params: cleaned });
    const result = res.data as IListClassesResult;
    return { data: result.data, meta: result.meta, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: [], meta: { total: 0, page: 1, pageSize: 20 }, errors: extractErrors(error.response.data) };
    }
    return { data: [], meta: { total: 0, page: 1, pageSize: 20 }, errors: ['Lấy danh sách lớp thất bại'] };
  }
}
