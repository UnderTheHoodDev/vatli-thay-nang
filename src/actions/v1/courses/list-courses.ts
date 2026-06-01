'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  CoursesListStats,
  IListCoursesParams,
  IListCoursesResult,
} from '@/types/actions/course-management';

export interface ListCoursesResponse {
  data: IListCoursesResult['data'];
  meta: IListCoursesResult['meta'];
  stats: CoursesListStats;
  errors: string[];
}

const EMPTY_STATS: CoursesListStats = {
  total: 0,
  draft: 0,
  published: 0,
  archived: 0,
};

export async function listCourses(params: IListCoursesParams): Promise<ListCoursesResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get('/api/v1/courses', { params: cleaned });
    const result = res.data as IListCoursesResult;
    return {
      data: result.data,
      meta: result.meta,
      stats: result.stats,
      errors: [],
    };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return {
        data: [],
        meta: { total: 0, page: 1, pageSize: 20 },
        stats: EMPTY_STATS,
        errors: extractErrors(error.response.data),
      };
    }
    return {
      data: [],
      meta: { total: 0, page: 1, pageSize: 20 },
      stats: EMPTY_STATS,
      errors: ['Lấy danh sách khóa học thất bại'],
    };
  }
}
