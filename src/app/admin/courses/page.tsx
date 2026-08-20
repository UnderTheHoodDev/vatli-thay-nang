import { listCourses } from '@/actions/v1/courses/list-courses';
import { listUsers } from '@/actions/v1/users/list-users';
import { getScheduleSettings } from '@/actions/v1/schedule-settings/get-schedule-settings';
import { ALL_VALUE } from '@/lib/constants';
import type { CourseStatus } from '@/types/course-management';
import CoursesPageClient, { type UrlState } from './CoursesPageClient';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): UrlState {
  return {
    q: sp.q ?? '',
    status: sp.status ?? ALL_VALUE,
    instructorId: sp.instructorId ?? ALL_VALUE,
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 20,
  };
}

export default async function CoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const apiParams = {
    q: urlState.q || undefined,
    status: urlState.status !== ALL_VALUE ? (urlState.status as CourseStatus) : undefined,
    instructorId: urlState.instructorId !== ALL_VALUE ? Number(urlState.instructorId) : undefined,
    page: urlState.page,
    pageSize: urlState.pageSize,
  };

  // Giảng viên là ADMIN — lấy danh sách cho dropdown lọc trên header cột.
  const [scheduleSettings, instructorsResult] = await Promise.all([
    getScheduleSettings(),
    listUsers({ role: 'ADMIN', pageSize: 100 }),
  ]);
  const coursesPromise = listCourses(apiParams);

  const instructorOptions = instructorsResult.data.map((u) => ({
    value: String(u.id),
    label: u.fullName ?? u.email,
  }));

  return (
    <CoursesPageClient
      urlState={urlState}
      coursesPromise={coursesPromise}
      scheduleSettings={scheduleSettings}
      instructorOptions={instructorOptions}
    />
  );
}
