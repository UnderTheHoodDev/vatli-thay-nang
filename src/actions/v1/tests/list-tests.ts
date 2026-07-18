'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import { fetchAllPages } from '@/lib/paginate';
import type { IListTestsResult } from '@/types/actions/tests';
import type { AdminTestRow, PageMeta, StudentTestRow } from '@/types/tests';

const EMPTY_META: PageMeta = { total: 0, page: 1, pageSize: 0 };

export interface ListTestsResponse<T> {
  data: T[];
  meta: PageMeta;
  errors: string[];
}

/**
 * Danh sách bài kiểm tra của khóa học — gom hết các trang, xem `fetchAllPages`.
 *
 * BE trả field theo role: admin thấy submissionCount/participantCount, học sinh thấy
 * mySubmissionStatus/myScore.
 */
export async function listTests<T extends AdminTestRow | StudentTestRow>(
  courseId: number,
): Promise<ListTestsResponse<T>> {
  try {
    const { data, meta } = await fetchAllPages<T>(async (page, pageSize) => {
      const res = await api.get(`/api/v1/courses/${courseId}/tests`, {
        params: { page, pageSize },
      });
      return res.data as IListTestsResult<T>;
    });
    return { data, meta, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: [], meta: EMPTY_META, errors: extractErrors(error.response.data) };
    }
    return { data: [], meta: EMPTY_META, errors: ['Lấy danh sách bài kiểm tra thất bại'] };
  }
}
