import { listCourses } from '@/actions/v1/courses/list-courses';
import { listCourseCategories } from '@/actions/v1/course-categories/list-course-categories';
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

  const [coursesRes, categoriesRes] = await Promise.all([
    listCourses(apiParams),
    listCourseCategories({ pageSize: 200 }),
  ]);

  return (
    <CoursesPageClient
      urlState={urlState}
      rows={coursesRes.data}
      meta={coursesRes.meta}
      stats={coursesRes.stats}
      errors={coursesRes.errors}
      categories={categoriesRes.data}
    />
  );
}
