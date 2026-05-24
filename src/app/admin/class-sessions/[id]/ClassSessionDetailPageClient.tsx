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
import type { ListMeta } from '@/types/auth';
import type { ClassSessionDetail } from '@/types/actions/class-management';
import type { AttendanceSessionListRow, AttendanceSummary } from '@/types/actions/attendance';
import type { ClassSessionStatus } from '@/types/class-management';

interface Props {
  classSession: ClassSessionDetail;
  attendanceSessions: AttendanceSessionListRow[];
  attendanceSessionsMeta: ListMeta;
  attendanceSessionsErrors: string[];
  summary: AttendanceSummary | null;
  summaryErrors: string[];
}

const STATUS_LABEL: Record<
  ClassSessionStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }
> = {
  SCHEDULED: { label: 'Đã lên lịch', variant: 'outline' },
  IN_PROGRESS: { label: 'Đang diễn ra', variant: 'success' },
  COMPLETED: { label: 'Hoàn thành', variant: 'secondary' },
  CANCELLED: { label: 'Đã huỷ', variant: 'destructive' },
};

export default function ClassSessionDetailPageClient({
  classSession,
  attendanceSessions,
  attendanceSessionsErrors,
  summary,
  summaryErrors,
}: Props) {
  useEffect(() => {
    handleActionErrors(attendanceSessionsErrors);
  }, [attendanceSessionsErrors]);

  useEffect(() => {
    handleActionErrors(summaryErrors);
  }, [summaryErrors]);

  const statusInfo = STATUS_LABEL[classSession.status];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground w-fit cursor-pointer pl-1"
        >
          <Link href="/admin/classes">
            <ArrowLeft /> Danh sách lớp học
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

      <AttendanceOverview counts={summary?.counts ?? null} />
    </div>
  );
}
