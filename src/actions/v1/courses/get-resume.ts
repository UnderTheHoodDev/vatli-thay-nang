'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import type { CourseResume } from '@/types/course-management';

/**
 * Lấy lesson item để học sinh vào thẳng màn học (resume / item đầu).
 * Trả null nếu khóa học không tồn tại / không truy cập được (404).
 */
export async function getResume(courseId: number): Promise<CourseResume | null> {
  try {
    const res = await api.get(`/api/v1/courses/${courseId}/resume`);
    return (res.data as { data: CourseResume }).data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
