'use client';

import { useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ManualAttendanceDialog, {
  type ManualDialogMode,
} from '@/components/features/class-sessions/ManualAttendanceDialog';
import type { AttendanceSummary, AttendanceSummaryStudent } from '@/types/actions/attendance';

function formatHm(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PLACEHOLDER_STUDENT: AttendanceSummaryStudent = {
  studentId: 0,
  fullName: null,
  email: '',
  leaveRequest: null,
  attendances: [],
};

interface Props {
  classSessionId: number;
  summary: AttendanceSummary | null;
  onChanged: () => void;
}

interface DialogState {
  mode: ManualDialogMode;
  student: AttendanceSummaryStudent;
}

export default function AttendanceSummaryTable({ classSessionId, summary, onChanged }: Props) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const sessions = summary?.attendanceSessions ?? [];

  const studentRows = useMemo(() => {
    const students = summary?.students ?? [];
    return students.map((s) => {
      const logsBySession = new Map<number, AttendanceSummaryStudent['attendances'][number]>();
      for (const log of s.attendances) {
        logsBySession.set(log.attendanceSessionId, log);
      }
      return { ...s, logsBySession };
    });
  }, [summary]);

  if (!summary) {
    return (
      <div className="text-muted-foreground border-divider rounded-md border border-dashed p-6 text-center text-sm">
        Không có dữ liệu điểm danh
      </div>
    );
  }

  const colCount = 4 + sessions.length * 2 + 1;

  return (
    <>
      <div className="border-divider overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[180px]">Họ tên học sinh</TableHead>
              <TableHead className="w-20 text-center">Xin nghỉ</TableHead>
              <TableHead className="min-w-[180px]">Lý do nghỉ</TableHead>
              {sessions.map((s, idx) => (
                <SessionColumnHead key={s.id} idx={idx} />
              ))}
              <TableHead className="w-16 text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-muted-foreground text-center">
                  Chưa có học sinh trong lớp
                </TableCell>
              </TableRow>
            ) : (
              studentRows.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell className="text-foreground font-medium">
                    {row.fullName ?? row.email}
                    {row.fullName && (
                      <div className="text-muted-foreground text-xs">{row.email}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.leaveRequest ? (
                      row.leaveRequest.status === 'ACKNOWLEDGED' ? (
                        <Badge variant="success">Đã duyệt</Badge>
                      ) : (
                        <Badge variant="warning">Chờ duyệt</Badge>
                      )
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.leaveRequest ? (
                      <span className="text-foreground text-sm">{row.leaveRequest.reason}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  {sessions.map((s) => {
                    const log = row.logsBySession.get(s.id);
                    return <SessionColumnCells key={s.id} log={log} />;
                  })}
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                            title="Hành động"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setDialog({ mode: 'mark', student: row })}
                          >
                            Đánh dấu có mặt
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setDialog({ mode: 'remove', student: row })}
                          >
                            Huỷ điểm danh
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setDialog({ mode: 'note', student: row })}
                          >
                            Thêm ghi chú
                          </DropdownMenuItem>
                          {row.leaveRequest && row.leaveRequest.status === 'SUBMITTED' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() =>
                                  setDialog({
                                    mode: 'acknowledgeLeave',
                                    student: row,
                                  })
                                }
                              >
                                Xác nhận nghỉ
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ManualAttendanceDialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        mode={dialog?.mode ?? 'mark'}
        classSessionId={classSessionId}
        student={dialog?.student ?? PLACEHOLDER_STUDENT}
        attendanceSessions={sessions}
        onSuccess={() => {
          setDialog(null);
          onChanged();
        }}
      />
    </>
  );
}

function SessionColumnHead({ idx }: { idx: number }) {
  return (
    <>
      <TableHead className="min-w-[120px] text-center">
        Phiên #{idx + 1}
        <div className="text-muted-foreground text-[10px] font-normal normal-case">
          Đã điểm danh
        </div>
      </TableHead>
      <TableHead className="min-w-[100px] text-center">
        Phiên #{idx + 1}
        <div className="text-muted-foreground text-[10px] font-normal normal-case">Thời gian</div>
      </TableHead>
    </>
  );
}

function SessionColumnCells({
  log,
}: {
  log: AttendanceSummaryStudent['attendances'][number] | undefined;
}) {
  return (
    <>
      <TableCell className="text-center">
        {log ? (
          <Badge variant={log.source === 'MANUAL' ? 'warning' : 'success'}>
            {log.source === 'MANUAL' ? 'Có (TC)' : 'Có'}
          </Badge>
        ) : (
          <Badge variant="outline">Không</Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-center text-xs">
        {log ? formatHm(log.checkedAt) : '—'}
      </TableCell>
    </>
  );
}
