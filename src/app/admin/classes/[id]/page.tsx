import { notFound } from 'next/navigation';
import { getClass } from '@/actions/v1/classes/get-class';
import { listClassStudents } from '@/actions/v1/classes/list-class-students';
import ClassDetailPageClient, {
  type ClassDetailTab,
  type ClassDetailUrlState,
} from './ClassDetailPageClient';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): ClassDetailUrlState {
  const tab: ClassDetailTab = sp.tab === 'students' ? 'students' : 'info';
  return {
    tab,
    email: sp.email ?? '',
    fullName: sp.fullName ?? '',
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 20,
  };
}

export default async function ClassDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const classId = Number(id);
  if (!Number.isInteger(classId) || classId <= 0) notFound();

  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const classDetail = await getClass(classId);
  if (!classDetail) notFound();

  const studentsRes =
    urlState.tab === 'students'
      ? await listClassStudents(classId, {
          email: urlState.email || undefined,
          fullName: urlState.fullName || undefined,
          page: urlState.page,
          pageSize: urlState.pageSize,
        })
      : {
          data: [],
          meta: { total: 0, page: urlState.page, pageSize: urlState.pageSize },
          errors: [],
        };

  return (
    <ClassDetailPageClient
      classDetail={classDetail}
      urlState={urlState}
      students={studentsRes.data}
      studentsMeta={studentsRes.meta}
      studentsErrors={studentsRes.errors}
    />
  );
}
