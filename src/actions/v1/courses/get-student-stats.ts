'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { CourseStudentStatsDetail } from '@/types/course-management';

export interface GetStudentStatsResponse {
  data: CourseStudentStatsDetail | null;
  errors: string[];
}

export async function getStudentStatsAction(
  courseId: number,
  studentId: number,
): Promise<GetStudentStatsResponse> {
  try {
    const res = await api.get(
      `/api/v1/courses/${courseId}/stats/students/${studentId}`,
    );
    const data = (res.data as { data: CourseStudentStatsDetail }).data;
    return { data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Không tải được chi tiết thống kê'] };
  }
}
