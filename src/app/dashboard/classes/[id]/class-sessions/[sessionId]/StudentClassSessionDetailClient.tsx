'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ClassSessionInfoSection from '@/components/features/class-sessions/ClassSessionInfoSection';
import StudentAttendancePanel from '@/components/features/class-sessions/StudentAttendancePanel';
import { CLASS_SESSION_STATUS_MAP, getEffectiveStatus } from '@/lib/class-sessions';
import { handleActionErrors } from '@/lib/actions';
import type { ClassSessionDetail } from '@/types/actions/class-management';
import type { MyAttendanceLog } from '@/types/actions/attendance';
import type { MyLeaveRequest } from '@/actions/v1/leave-requests/get-my-leave-request';

interface Props {
  classId: number;
  classSession: ClassSessionDetail;
  myAttendance: MyAttendanceLog[];
  myLeaveRequest: MyLeaveRequest | null;
  errors: string[];
}

export default function StudentClassSessionDetailClient({
  classId,
  classSession,
  myAttendance,
  myLeaveRequest,
  errors,
}: Props) {
  useEffect(() => {
    handleActionErrors(errors);
  }, [errors]);

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
          <Link href={`/dashboard/classes/${classId}`}>
            <ArrowLeft /> Quay lại danh sách buổi học
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-paytone text-foreground text-2xl tracking-tight">
            {classSession.title}
          </h1>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </div>

      <ClassSessionInfoSection classSession={classSession} />

      <StudentAttendancePanel
        classSessionId={classSession.id}
        activeAttendanceSession={classSession.activeAttendanceSession}
        myAttendance={myAttendance}
        myLeaveRequest={myLeaveRequest}
      />
    </div>
  );
}
