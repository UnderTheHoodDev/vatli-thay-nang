'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Power, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/app/EmptyState';
import OpenAttendanceDialog from '@/components/features/class-sessions/OpenAttendanceDialog';
import AttendanceSessionsTimeline from '@/components/features/class-sessions/AttendanceSessionsTimeline';
import AttendanceSummaryTable from '@/components/features/class-sessions/AttendanceSummaryTable';
import type {
  AttendanceSessionListRow,
  AttendanceSummary,
} from '@/types/actions/attendance';

interface Props {
  classSessionId: number;
  activeAttendanceSession: { id: number; closedAt: string } | null;
  attendanceSessions: AttendanceSessionListRow[];
  summary: AttendanceSummary | null;
}

export default function AttendanceSection({
  classSessionId,
  activeAttendanceSession,
  attendanceSessions,
  summary,
}: Props) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);

  const hasActive = !!activeAttendanceSession;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Điểm danh</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Mở phiên điểm danh và theo dõi kết quả của học sinh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActive ? (
            <span className="text-purple inline-flex items-center gap-1.5 text-sm font-medium">
              <Radio className="size-4 animate-pulse" />
              Đang có phiên điểm danh
            </span>
          ) : (
            <Button
              onClick={() => setOpenDialog(true)}
              className="cursor-pointer"
            >
              <Power className="size-4" />
              Bật điểm danh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        <section className="space-y-3">
          <h3 className="text-foreground text-sm font-semibold">
            Các phiên điểm danh
          </h3>
          {attendanceSessions.length === 0 ? (
            <div className="bg-muted/40 rounded-md">
              <EmptyState
                icon={Radio}
                title="Chưa có phiên điểm danh nào"
                description="Bấm Bật điểm danh để mở phiên đầu tiên cho buổi học này."
              />
            </div>
          ) : (
            <AttendanceSessionsTimeline
              classSessionId={classSessionId}
              sessions={attendanceSessions}
              onChanged={() => router.refresh()}
            />
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-foreground text-sm font-semibold">
            Bảng tổng hợp điểm danh
          </h3>
          <AttendanceSummaryTable
            classSessionId={classSessionId}
            summary={summary}
            onChanged={() => router.refresh()}
          />
        </section>
      </CardContent>

      <OpenAttendanceDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        classSessionId={classSessionId}
        onOpened={() => {
          setOpenDialog(false);
          router.refresh();
        }}
      />
    </Card>
  );
}
