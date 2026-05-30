'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { ListMeta } from '@/types/auth';
import type { CourseStatsRow } from '@/types/course-management';

export interface ListCourseStatsParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ListCourseStatsResult {
  data: CourseStatsRow[];
  meta: ListMeta;
}

export interface ListCourseStatsResponse {
  data: ListCourseStatsResult | null;
  errors: string[];
}

export async function listCourseStatsAction(
  courseId: number,
  params: ListCourseStatsParams = {},
): Promise<ListCourseStatsResponse> {
  try {
    const res = await api.get(`/api/v1/courses/${courseId}/stats`, { params });
    return { data: res.data as ListCourseStatsResult, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Không tải được thống kê'] };
  }
}
