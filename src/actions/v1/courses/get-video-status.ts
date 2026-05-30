'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { ICourseVideoStatusResult } from '@/types/actions/course-management';

export interface GetCourseVideoStatusResponse {
  data: ICourseVideoStatusResult | null;
  errors: string[];
}

/** Read-only poll trạng thái xử lý video của khóa (KHÔNG revalidatePath). */
export async function getCourseVideoStatusAction(
  courseId: number,
): Promise<GetCourseVideoStatusResponse> {
  try {
    const res = await api.get(`/api/v1/courses/${courseId}/video-status`);
    const data = (res.data as { data: ICourseVideoStatusResult }).data;
    return { data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Không tải được trạng thái video'] };
  }
}
