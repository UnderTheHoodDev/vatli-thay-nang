import { notFound } from 'next/navigation';
import { getClass } from '@/actions/v1/classes/get-class';
import { listClassSessions } from '@/actions/v1/class-sessions/list-class-sessions';
import StudentClassDetailClient from './StudentClassDetailClient';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function StudentClassDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const classId = Number(id);
  if (!Number.isInteger(classId) || classId <= 0) notFound();

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const pageSize = Number(sp.pageSize) || 20;

  const [classRow, sessionsRes] = await Promise.all([
    getClass(classId),
    listClassSessions(classId, { page, pageSize }),
  ]);

  if (!classRow) notFound();

  return (
    <StudentClassDetailClient
      classRow={classRow}
      sessions={sessionsRes.data}
      meta={sessionsRes.meta}
      errors={sessionsRes.errors}
      page={page}
      pageSize={pageSize}
    />
  );
}
