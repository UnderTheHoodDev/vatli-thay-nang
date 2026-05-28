'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import type { LessonDetail } from '@/types/course-management';

export async function getLesson(id: number): Promise<LessonDetail | null> {
  try {
    const res = await api.get(`/api/v1/lessons/${id}`);
    return (res.data as { data: LessonDetail }).data;
  } catch (error) {
    if (
      error instanceof AxiosError &&
      (error.response?.status === 404 || error.response?.status === 403)
    ) {
      return null;
    }
    throw error;
  }
}
