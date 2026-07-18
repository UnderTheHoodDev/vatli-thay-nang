'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import { fetchAllPages } from '@/lib/paginate';
import type { IListSubmissionsParams, IListSubmissionsResult } from '@/types/actions/tests';
import type { PageMeta, SubmissionRow, TestStats } from '@/types/tests';

const EMPTY_META: PageMeta = { total: 0, page: 1, pageSize: 0 };

const EMPTY_STATS: TestStats = {
  participantCount: 0,
  submittedCount: 0,
  gradedCount: 0,
  avg: null,
  min: null,
  max: null,
  distribution: [],
};

export interface ListSubmissionsResponse {
  data: SubmissionRow[];
  meta: PageMeta;
  stats: TestStats;
  errors: string[];
}

/**
 * Bài nộp + thống kê (ADMIN) — gom hết các trang, xem `fetchAllPages`. Học sinh chưa nộp
 * vẫn có dòng, status = NOT_SUBMITTED.
 */
export async function listSubmissions(
  testId: number,
  params: Omit<IListSubmissionsParams, 'page' | 'pageSize'> = {},
): Promise<ListSubmissionsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
  );

  // stats giống nhau ở mọi trang (BE tính trên cả bài, không theo trang) — lấy ở trang đầu.
  let stats = EMPTY_STATS;

  try {
    const { data, meta } = await fetchAllPages<SubmissionRow>(async (page, pageSize) => {
      const res = await api.get(`/api/v1/tests/${testId}/submissions`, {
        params: { ...cleaned, page, pageSize },
      });
      const result = res.data as IListSubmissionsResult;
      if (page === 1) stats = result.stats;
      return result;
    });
    return { data, meta, stats, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return {
        data: [],
        meta: EMPTY_META,
        stats: EMPTY_STATS,
        errors: extractErrors(error.response.data),
      };
    }
    return {
      data: [],
      meta: EMPTY_META,
      stats: EMPTY_STATS,
      errors: ['Lấy danh sách bài nộp thất bại'],
    };
  }
}
