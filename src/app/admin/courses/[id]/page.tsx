import { notFound } from 'next/navigation';
import { getCourse } from '@/actions/v1/courses/get-course';
import {
  listCourseEnrollments,
  type ListCourseEnrollmentsResponse,
} from '@/actions/v1/courses/list-course-enrollments';
import { ALL_VALUE } from '@/lib/constants';
import CourseDetailPageClient, {
  type CourseDetailTab,
  type CourseDetailUrlState,
} from './CourseDetailPageClient';
import type { CourseEnrollmentStatus } from '@/types/course-management';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): CourseDetailUrlState {
  const tab: CourseDetailTab =
    sp.tab === 'structure'
      ? 'structure'
      : sp.tab === 'enrollments'
        ? 'enrollments'
        : sp.tab === 'stats'
          ? 'stats'
          : 'info';
  // Chỉ nhận giá trị hợp lệ — status lạ trên URL rơi về "tất cả".
  const status: string = sp.status === 'ACTIVE' || sp.status === 'REVOKED' ? sp.status : ALL_VALUE;
  return {
    tab,
    q: sp.q ?? '',
    status,
    classId: sp.classId ?? ALL_VALUE,
    enrolledFrom: sp.enrolledFrom ?? '',
    enrolledTo: sp.enrolledTo ?? '',
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 20,
  };
}

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId) || courseId <= 0) notFound();

  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const course = await getCourse(courseId);
  if (!course) notFound();

  const enrollmentsPromise: Promise<ListCourseEnrollmentsResponse> =
    urlState.tab === 'enrollments'
      ? listCourseEnrollments(courseId, {
          q: urlState.q || undefined,
          status:
            urlState.status === ALL_VALUE
              ? undefined
              : (urlState.status as CourseEnrollmentStatus),
          classId: urlState.classId !== ALL_VALUE ? Number(urlState.classId) : undefined,
          enrolledFrom: urlState.enrolledFrom || undefined,
          enrolledTo: urlState.enrolledTo || undefined,
          page: urlState.page,
          pageSize: urlState.pageSize,
        })
      : Promise.resolve({
          data: [],
          meta: { total: 0, page: urlState.page, pageSize: urlState.pageSize },
          errors: [],
        });

  return (
    <CourseDetailPageClient
      course={course}
      urlState={urlState}
      enrollmentsPromise={enrollmentsPromise}
    />
  );
}
