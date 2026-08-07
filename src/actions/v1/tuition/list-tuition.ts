'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IListTuitionParams, IListTuitionResult } from '@/types/actions/tuition';

export interface ListTuitionResponse {
  data: IListTuitionResult['data'];
  meta: IListTuitionResult['meta'];
  stats: IListTuitionResult['stats'];
  errors: string[];
}

function emptyStats(params: IListTuitionParams): IListTuitionResult['stats'] {
  return {
    classId: params.classId,
    year: params.year,
    month: params.month,
    sessionCount: 0,
    studentCount: 0,
    totalDue: 0,
    totalPaid: 0,
    totalRemaining: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    nothingDueCount: 0,
    outOfSyncCount: 0,
  };
}

export async function listTuition(params: IListTuitionParams): Promise<ListTuitionResponse> {
  try {
    const res = await api.get('/api/v1/tuition', { params });
    const result = res.data as IListTuitionResult;
    return { data: result.data, meta: result.meta, stats: result.stats, errors: [] };
  } catch (error) {
    const emptyMeta = { total: 0, page: 1, pageSize: 100 };
    if (error instanceof AxiosError && error.response?.data) {
      return {
        data: [],
        meta: emptyMeta,
        stats: emptyStats(params),
        errors: extractErrors(error.response.data),
      };
    }
    return {
      data: [],
      meta: emptyMeta,
      stats: emptyStats(params),
      errors: ['Lấy bảng học phí thất bại'],
    };
  }
}
