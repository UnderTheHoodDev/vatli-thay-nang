import { notFound } from 'next/navigation';
import { getClassSession } from '@/actions/v1/class-sessions/get-class-session';
import { listAttendanceSessions } from '@/actions/v1/attendance/list-attendance-sessions';
import { getAttendanceSummary } from '@/actions/v1/attendance/get-attendance-summary';
import ClassSessionDetailPageClient from './ClassSessionDetailPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassSessionDetailPage({ params }: Props) {
  const { id } = await params;
  const classSessionId = Number(id);
  if (!Number.isInteger(classSessionId) || classSessionId <= 0) notFound();

  const [classSession, attendanceSessionsRes, summaryRes] = await Promise.all([
    getClassSession(classSessionId),
    listAttendanceSessions(classSessionId, { page: 1, pageSize: 50 }),
    getAttendanceSummary(classSessionId),
  ]);

  if (!classSession) notFound();

  return (
    <ClassSessionDetailPageClient
      classSession={classSession}
      attendanceSessions={attendanceSessionsRes.data}
      attendanceSessionsMeta={attendanceSessionsRes.meta}
      attendanceSessionsErrors={attendanceSessionsRes.errors}
      summary={summaryRes.data}
      summaryErrors={summaryRes.errors}
    />
  );
}
