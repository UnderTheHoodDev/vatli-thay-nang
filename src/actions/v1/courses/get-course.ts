'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import type { CourseDetail } from '@/types/course-management';

export async function getCourse(id: number): Promise<CourseDetail | null> {
  try {
    const res = await api.get(`/api/v1/courses/${id}`);
    return (res.data as { data: CourseDetail }).data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
