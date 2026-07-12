import { listCourseCategories } from '@/actions/v1/course-categories/list-course-categories';
import CourseCategoriesPageClient, {
  type UrlState,
} from '@/app/admin/course-categories/CourseCategoriesPageClient';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): UrlState {
  return {
    name: sp.name ?? '',
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 20,
  };
}

export default async function CourseCategoriesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const categoriesPromise = listCourseCategories({
    name: urlState.name || undefined,
    page: urlState.page,
    pageSize: urlState.pageSize,
  });

  return <CourseCategoriesPageClient urlState={urlState} categoriesPromise={categoriesPromise} />;
}
