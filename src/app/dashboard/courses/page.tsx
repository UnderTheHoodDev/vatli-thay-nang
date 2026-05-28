import { listCourses } from '@/actions/v1/courses/list-courses';
import StudentCoursesClient, { type UrlState } from './StudentCoursesClient';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): UrlState {
  return {
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 20,
  };
}

export default async function StudentCoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const result = await listCourses({
    status: 'PUBLISHED',
    page: urlState.page,
    pageSize: urlState.pageSize,
  });

  return (
    <StudentCoursesClient
      urlState={urlState}
      rows={result.data}
      meta={result.meta}
      errors={result.errors}
    />
  );
}
