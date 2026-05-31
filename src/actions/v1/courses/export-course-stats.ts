'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';

export interface ExportCourseStatsResponse {
  csv: string | null;
  errors: string[];
}

export async function exportCourseStatsAction(
  courseId: number,
): Promise<ExportCourseStatsResponse> {
  try {
    const res = await api.get(`/api/v1/courses/${courseId}/stats/export.csv`, {
      responseType: 'text',
      transformResponse: [(d) => d],
    });
    return { csv: String(res.data), errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { csv: null, errors: extractErrors(error.response.data) };
    }
    return { csv: null, errors: ['Không xuất được CSV'] };
  }
}
