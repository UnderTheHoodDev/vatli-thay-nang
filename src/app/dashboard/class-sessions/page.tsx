import { listClasses } from '@/actions/v1/classes/list-classes';
import { listClassSessions } from '@/actions/v1/class-sessions/list-class-sessions';
import StudentClassSessionsClient from './StudentClassSessionsClient';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function StudentClassSessionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const classesRes = await listClasses({ page: 1, pageSize: 100 });

  const selectedClassId = Number(sp.classId) || (classesRes.data[0]?.id ?? null);

  const sessionsRes = selectedClassId
    ? await listClassSessions(selectedClassId, { page: 1, pageSize: 100 })
    : { data: [], errors: [] };

  return (
    <StudentClassSessionsClient
      classes={classesRes.data}
      selectedClassId={selectedClassId}
      sessions={sessionsRes.data}
      errors={[...classesRes.errors, ...sessionsRes.errors]}
    />
  );
}
