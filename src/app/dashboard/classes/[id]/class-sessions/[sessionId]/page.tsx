import { notFound } from 'next/navigation';
import { getClassSession } from '@/actions/v1/class-sessions/get-class-session';
import { getMyAttendance } from '@/actions/v1/attendance/get-my-attendance';
import { getMyLeaveRequestAction } from '@/actions/v1/leave-requests/get-my-leave-request';
import StudentClassSessionDetailClient from './StudentClassSessionDetailClient';

interface Props {
  params: Promise<{ id: string; sessionId: string }>;
}

export default async function StudentClassSessionDetailPage({ params }: Props) {
  const { id, sessionId } = await params;
  const classId = Number(id);
  const classSessionId = Number(sessionId);
  if (!Number.isInteger(classId) || classId <= 0) notFound();
  if (!Number.isInteger(classSessionId) || classSessionId <= 0) notFound();

  const myAttendancePromise = getMyAttendance(classSessionId);
  const myLeaveRequestPromise = getMyLeaveRequestAction(classSessionId);

  const classSession = await getClassSession(classSessionId);
  if (!classSession) notFound();

  return (
    <StudentClassSessionDetailClient
      classId={classId}
      classSession={classSession}
      myAttendancePromise={myAttendancePromise}
      myLeaveRequestPromise={myLeaveRequestPromise}
    />
  );
}
