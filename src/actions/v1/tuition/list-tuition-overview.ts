'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IListTuitionOverviewParams,
  IListTuitionOverviewResult,
} from '@/types/actions/tuition';

export interface ListTuitionOverviewResponse {
  data: IListTuitionOverviewResult['data'];
  meta: IListTuitionOverviewResult['meta'];
  stats: IListTuitionOverviewResult['stats'];
  errors: string[];
}

function emptyStats(params: IListTuitionOverviewParams): IListTuitionOverviewResult['stats'] {
  return { year: params.year, month: params.month, receivedThisMonth: 0, receivedToDate: 0 };
}

export async function listTuitionOverview(
  params: IListTuitionOverviewParams,
): Promise<ListTuitionOverviewResponse> {
  try {
    const res = await api.get('/api/v1/tuition/overview', { params });
    const result = res.data as IListTuitionOverviewResult;
    return { data: result.data, meta: result.meta, stats: result.stats, errors: [] };
  } catch (error) {
    const emptyMeta = { total: 0, page: params.page ?? 1, pageSize: params.pageSize ?? 20 };
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
      errors: ['Lấy tổng quan học phí thất bại'],
    };
  }
}
