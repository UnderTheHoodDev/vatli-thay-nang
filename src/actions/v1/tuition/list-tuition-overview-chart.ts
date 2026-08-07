'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IListTuitionOverviewChartParams,
  IListTuitionOverviewChartResult,
} from '@/types/actions/tuition';

export interface ListTuitionOverviewChartResponse {
  data: IListTuitionOverviewChartResult['data'];
  stats: IListTuitionOverviewChartResult['stats'];
  errors: string[];
}

function emptyStats(
  params: IListTuitionOverviewChartParams,
): IListTuitionOverviewChartResult['stats'] {
  return {
    fromYear: params.fromYear,
    fromMonth: params.fromMonth,
    toYear: params.toYear,
    toMonth: params.toMonth,
    totalDue: 0,
    totalPaid: 0,
    totalRemaining: 0,
    collectionRate: 0,
  };
}

export async function listTuitionOverviewChart(
  params: IListTuitionOverviewChartParams,
): Promise<ListTuitionOverviewChartResponse> {
  try {
    const res = await api.get('/api/v1/tuition/overview/chart', { params });
    const result = res.data as IListTuitionOverviewChartResult;
    return { data: result.data, stats: result.stats, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: [], stats: emptyStats(params), errors: extractErrors(error.response.data) };
    }
    return { data: [], stats: emptyStats(params), errors: ['Lấy xu hướng học phí thất bại'] };
  }
}
