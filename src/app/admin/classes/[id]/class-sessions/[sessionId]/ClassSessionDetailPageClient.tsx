'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { handleActionErrors } from '@/lib/actions';
import ClassSessionInfoSection from '@/components/features/class-sessions/ClassSessionInfoSection';
import AttendanceSection from '@/components/features/class-sessions/AttendanceSection';
import AttendanceOverview from '@/components/features/class-sessions/AttendanceOverview';
import LeaveRequestsSection from '@/components/features/leave-requests/LeaveRequestsSection';
import { CLASS_SESSION_STATUS_MAP, getEffectiveStatus } from '@/lib/class-sessions';
import type { ListMeta } from '@/types/auth';
import type { ClassSessionDetail } from '@/types/actions/class-management';
import type { AttendanceSessionListRow, AttendanceSummary } from '@/types/actions/attendance';
import type { LeaveRequestListRow } from '@/types/actions/leave-requests';

interface Props {
  classId: number;
  classSession: ClassSessionDetail;
  backHref: string;
  backLabel: string;
  attendanceSessions: AttendanceSessionListRow[];
  attendanceSessionsMeta: ListMeta;
  attendanceSessionsErrors: string[];
  summary: AttendanceSummary | null;
  summaryErrors: string[];
  leaveRequests: LeaveRequestListRow[];
  leaveRequestsMeta: ListMeta;
}

export default function ClassSessionDetailPageClient({
  classSession,
  backHref,
  backLabel,
  attendanceSessions,
  attendanceSessionsErrors,
  summary,
  summaryErrors,
  leaveRequests,
  leaveRequestsMeta,
}: Props) {
  useEffect(() => {
    handleActionErrors(attendanceSessionsErrors);
  }, [attendanceSessionsErrors]);

  useEffect(() => {
    handleActionErrors(summaryErrors);
  }, [summaryErrors]);

  const statusInfo =
    CLASS_SESSION_STATUS_MAP[getEffectiveStatus(classSession.startTime, classSession.endTime)];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground w-fit cursor-pointer pl-1"
        >
          <Link href={backHref}>
            <ArrowLeft /> {backLabel}
          </Link>
        </Button>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-paytone text-foreground text-2xl tracking-tight">
              {classSession.title}
            </h1>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </div>
      </div>

      <ClassSessionInfoSection classSession={classSession} />

      <AttendanceSection
        classSessionId={classSession.id}
        activeAttendanceSession={classSession.activeAttendanceSession}
        attendanceSessions={attendanceSessions}
        summary={summary}
      />

      <AttendanceOverview classSessionId={classSession.id} counts={summary?.counts ?? null} />

      <LeaveRequestsSection data={leaveRequests} meta={leaveRequestsMeta} />
    </div>
  );
}
