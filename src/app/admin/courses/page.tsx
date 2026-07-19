import { listCourses } from '@/actions/v1/courses/list-courses';
import { listCourseCategories } from '@/actions/v1/course-categories/list-course-categories';
import { getScheduleSettings } from '@/actions/v1/schedule-settings/get-schedule-settings';
import { ALL_VALUE } from '@/lib/constants';
import type { CourseStatus } from '@/types/course-management';
import CoursesPageClient, { type UrlState } from './CoursesPageClient';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): UrlState {
  return {
    title: sp.title ?? '',
    code: sp.code ?? '',
    categoryId: sp.categoryId ?? ALL_VALUE,
    status: sp.status ?? ALL_VALUE,
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 20,
  };
}

export default async function CoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const apiParams = {
    title: urlState.title || undefined,
    code: urlState.code || undefined,
    categoryId:
      urlState.categoryId !== ALL_VALUE ? Number(urlState.categoryId) || undefined : undefined,
    status: urlState.status !== ALL_VALUE ? (urlState.status as CourseStatus) : undefined,
    page: urlState.page,
    pageSize: urlState.pageSize,
  };

  const [categoriesRes, scheduleSettings] = await Promise.all([
    listCourseCategories({ pageSize: 200 }),
    getScheduleSettings(),
  ]);
  const coursesPromise = listCourses(apiParams);

  return (
    <CoursesPageClient
      urlState={urlState}
      coursesPromise={coursesPromise}
      categories={categoriesRes.data}
      scheduleSettings={scheduleSettings}
    />
  );
}
