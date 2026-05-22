import { notFound } from 'next/navigation';
import { getClass } from '@/actions/v1/classes/get-class';
import { listClassSessions } from '@/actions/v1/class-sessions/list-class-sessions';
import ClassSessionsPageClient from './ClassSessionsPageClient';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ClassSessionsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const classId = Number(id);
  if (!Number.isInteger(classId) || classId <= 0) notFound();

  const classDetail = await getClass(classId);
  if (!classDetail) notFound();

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const pageSize = Number(sp.pageSize) || 20;

  const sessionsRes = await listClassSessions(classId, { page, pageSize });

  return (
    <ClassSessionsPageClient
      classId={classId}
      className={classDetail.name}
      classCode={classDetail.code}
      rows={sessionsRes.data}
      meta={sessionsRes.meta}
      errors={sessionsRes.errors}
      page={page}
      pageSize={pageSize}
    />
  );
}
