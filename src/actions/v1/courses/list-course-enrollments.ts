'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IListEnrollmentsParams,
  IListEnrollmentsResult,
} from '@/types/actions/course-management';

export interface ListCourseEnrollmentsResponse {
  data: IListEnrollmentsResult['data'];
  meta: IListEnrollmentsResult['meta'];
  errors: string[];
}

export async function listCourseEnrollments(
  courseId: number,
  params: IListEnrollmentsParams = {},
): Promise<ListCourseEnrollmentsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get(`/api/v1/courses/${courseId}/enrollments`, {
      params: cleaned,
    });
    const result = res.data as IListEnrollmentsResult;
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
      errors: ['Lấy danh sách enrollment thất bại'],
    };
  }
}
