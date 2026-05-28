import { notFound } from 'next/navigation';
import { getCourse } from '@/actions/v1/courses/get-course';
import { listCourseCategories } from '@/actions/v1/course-categories/list-course-categories';
import { listCourseEnrollments } from '@/actions/v1/courses/list-course-enrollments';
import CourseDetailPageClient, {
  type CourseDetailTab,
  type CourseDetailUrlState,
} from './CourseDetailPageClient';

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
        : 'info';
  return {
    tab,
    email: sp.email ?? '',
    fullName: sp.fullName ?? '',
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

  const [categoriesRes, enrollmentsRes] = await Promise.all([
    listCourseCategories({ pageSize: 200 }),
    urlState.tab === 'enrollments'
      ? listCourseEnrollments(courseId, {
          email: urlState.email || undefined,
          fullName: urlState.fullName || undefined,
          page: urlState.page,
          pageSize: urlState.pageSize,
        })
      : Promise.resolve({
          data: [],
          meta: { total: 0, page: urlState.page, pageSize: urlState.pageSize },
          errors: [] as string[],
        }),
  ]);

  return (
    <CourseDetailPageClient
      course={course}
      urlState={urlState}
      categories={categoriesRes.data}
      enrollments={enrollmentsRes.data}
      enrollmentsMeta={enrollmentsRes.meta}
      enrollmentsErrors={enrollmentsRes.errors}
    />
  );
}
