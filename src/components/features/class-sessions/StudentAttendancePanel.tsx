'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ClipboardCheck, LogOut, Radio, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButton } from '@/components/ui/custom/ActionButton';
import SubmitLeaveRequestDialog from '@/components/features/leave-requests/SubmitLeaveRequestDialog';
import { checkAttendanceAction } from '@/actions/v1/attendance/check-attendance';
import { handleActionResult } from '@/lib/actions';
import { formatDateTimeShort } from '@/lib/format';
import type { MyAttendanceLog } from '@/types/actions/attendance';
import type { MyLeaveRequest } from '@/actions/v1/leave-requests/get-my-leave-request';

interface Props {
  classSessionId: number;
  activeAttendanceSession: { id: number; closedAt: string } | null;
  myAttendance: MyAttendanceLog[];
  myLeaveRequest: MyLeaveRequest | null;
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StudentAttendancePanel({
  classSessionId,
  activeAttendanceSession,
  myAttendance,
  myLeaveRequest,
}: Props) {
  const router = useRouter();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const remainingMs = activeAttendanceSession
    ? new Date(activeAttendanceSession.closedAt).getTime() - now
    : 0;

  const checkedAttendanceSessionIds = useMemo(
    () => new Set(myAttendance.map((a) => a.attendanceSessionId)),
    [myAttendance],
  );

  const hasCheckedActive =
    !!activeAttendanceSession && checkedAttendanceSessionIds.has(activeAttendanceSession.id);
  const expired = !!activeAttendanceSession && remainingMs <= 0;
  const showCheckButton = !!activeAttendanceSession && !hasCheckedActive && !expired;

  useEffect(() => {
    if (!activeAttendanceSession) return;
    const closedAtMs = new Date(activeAttendanceSession.closedAt).getTime();
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= closedAtMs) {
        clearInterval(timer);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeAttendanceSession, router]);

  const handleCheck = async () => {
    if (!activeAttendanceSession) return;
    setChecking(true);
    try {
      const result = await checkAttendanceAction(activeAttendanceSession.id);
      handleActionResult(result.errors, () => router.refresh(), 'Điểm danh thành công');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="size-5" /> Điểm danh & xin nghỉ
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Bấm <span className="font-medium">Điểm danh</span> khi giáo viên mở phiên, hoặc{' '}
          <span className="font-medium">Xin nghỉ</span> nếu bạn không thể tham gia.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        {activeAttendanceSession && !expired && (
          <div className="bg-primary/5 border-primary/20 flex flex-col items-start gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Radio className="text-primary size-4 animate-pulse" />
              <span className="text-foreground text-sm font-medium">Phiên điểm danh đang mở</span>
            </div>
            <div className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
              <Timer className="size-4" />
              <span className="text-foreground font-mono font-medium tabular-nums">
                {formatRemaining(remainingMs)}
              </span>{' '}
              còn lại
            </div>
          </div>
        )}

        {hasCheckedActive && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="size-4" />
            Bạn đã điểm danh phiên hiện tại.
          </div>
        )}

        {myLeaveRequest && (
          <div className="text-muted-foreground flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
            <span className="text-foreground font-medium">
              {myLeaveRequest.leaveType === 'EARLY_LEAVE' ? 'Xin rời sớm' : 'Xin nghỉ cả buổi'}
            </span>
            {myLeaveRequest.status === 'ACKNOWLEDGED' ? (
              <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Đã duyệt
              </span>
            ) : (
              <span className="ml-auto rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                Chờ duyệt
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {(!myLeaveRequest || myLeaveRequest.status === 'SUBMITTED') && (
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setLeaveDialogOpen(true)}
            >
              <LogOut className="size-4" />
              {myLeaveRequest ? 'Sửa đơn nghỉ' : 'Xin nghỉ'}
            </Button>
          )}

          {showCheckButton && (
            <ActionButton
              onClick={handleCheck}
              isLoading={checking}
              loadingText="Đang điểm danh..."
            >
              <ClipboardCheck className="size-4" /> Điểm danh
            </ActionButton>
          )}
        </div>

        {myAttendance.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-foreground text-sm font-semibold">Lịch sử điểm danh</h3>
            <ul className="space-y-1.5">
              {myAttendance.map((log) => (
                <li
                  key={log.attendanceSessionId}
                  className="border-divider bg-card text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span className="text-foreground font-medium">
                    Phiên #{log.attendanceSessionId}
                  </span>
                  <span className="text-muted-foreground">
                    — {formatDateTimeShort(log.checkedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <SubmitLeaveRequestDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        classSessionId={classSessionId}
        existingLeaveRequest={
          myLeaveRequest && myLeaveRequest.status === 'SUBMITTED' ? myLeaveRequest : null
        }
      />
    </Card>
  );
}
