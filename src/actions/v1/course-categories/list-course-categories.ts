'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IListCourseCategoriesParams,
  IListCourseCategoriesResult,
} from '@/types/actions/course-management';

export interface ListCourseCategoriesResponse {
  data: IListCourseCategoriesResult['data'];
  meta: IListCourseCategoriesResult['meta'];
  errors: string[];
}

export async function listCourseCategories(
  params: IListCourseCategoriesParams = {},
): Promise<ListCourseCategoriesResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== '' && v !== undefined && v !== null,
    ),
  );
  try {
    const res = await api.get('/api/v1/course-categories', { params: cleaned });
    const result = res.data as IListCourseCategoriesResult;
    return { data: result.data, meta: result.meta, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return {
        data: [],
        meta: { total: 0, page: 1, pageSize: 50 },
        errors: extractErrors(error.response.data),
      };
    }
    return {
      data: [],
      meta: { total: 0, page: 1, pageSize: 50 },
      errors: ['Lấy danh sách danh mục thất bại'],
    };
  }
}
