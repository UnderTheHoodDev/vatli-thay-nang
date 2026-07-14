'use server';

import { apiClient } from '@/lib/axios';
import type { PublicCourse } from '@/types/course-management';

export interface PublicCoursesResult {
  courses: PublicCourse[];
  upcoming: PublicCourse[];
}

export async function listPublicCourses(limit = 12): Promise<PublicCoursesResult> {
  try {
    const res = await apiClient.get('/api/v1/courses/public', {
      params: { pageSize: limit },
    });
    const courses = (res.data?.data ?? []) as PublicCourse[];
    const now = Date.now();
    const upcoming = courses.filter((c) => c.startDate && new Date(c.startDate).getTime() > now);
    return { courses, upcoming };
  } catch {
    return { courses: [], upcoming: [] };
  }
}
