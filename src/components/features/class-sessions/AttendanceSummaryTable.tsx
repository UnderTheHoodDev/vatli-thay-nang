'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardX, MoreHorizontal, Search, X } from 'lucide-react';
import DataPagination from '@/components/app/DataPagination';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { manualAttendanceAction } from '@/actions/v1/attendance/manual-attendance';
import { handleActionResult } from '@/lib/actions';
import { formatDateTimeShort } from '@/lib/format';
import type { AttendanceSummary, AttendanceSummaryStudent } from '@/types/actions/attendance';

function formatHm(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
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

type BulkMode = 'mark' | 'remove';

interface BulkDialogState {
  mode: BulkMode;
  students: AttendanceSummaryStudent[];
}

export default function AttendanceSummaryTable({ classSessionId, summary, onChanged }: Props) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [bulkDialog, setBulkDialog] = useState<BulkDialogState | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [appliedEmail, setAppliedEmail] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);

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

  const filteredRows = useMemo(() => {
    const name = appliedName.trim().toLowerCase();
    const email = appliedEmail.trim().toLowerCase();
    return studentRows.filter((r) => {
      const matchName =
        !name ||
        (r.fullName ?? '').toLowerCase().includes(name) ||
        r.email.toLowerCase().includes(name);
      const matchEmail = !email || r.email.toLowerCase().includes(email);
      return matchName && matchEmail;
    });
  }, [studentRows, appliedName, appliedEmail]);

  const handleSearch = () => {
    setAppliedName(nameInput);
    setAppliedEmail(emailInput);
    setPage(1);
  };

  const handleClear = () => {
    setNameInput('');
    setEmailInput('');
    setAppliedName('');
    setAppliedEmail('');
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const isFiltering = !!appliedName || !!appliedEmail;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = useMemo(
    () => filteredRows.slice((page - 1) * pageSize, page * pageSize),
    [filteredRows, page, pageSize],
  );

  const allFilteredIds = useMemo(() => filteredRows.map((r) => r.studentId), [filteredRows]);

  const allSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));
  const someSelected = allFilteredIds.some((id) => selectedIds.has(id));

  const selectedStudents = useMemo(
    () => studentRows.filter((r) => selectedIds.has(r.studentId)),
    [studentRows, selectedIds],
  );

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  if (!summary) {
    return (
      <div className="text-muted-foreground border-divider rounded-md border border-dashed p-6 text-center text-sm">
        Không có dữ liệu điểm danh
      </div>
    );
  }

  const colCount = 5 + sessions.length * 2 + 1;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-45 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Họ tên..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8"
          />
        </div>
        <div className="relative min-w-45 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Email..."
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8"
          />
        </div>
        <Button variant="default" onClick={handleSearch}>
          <Search className="size-4" />
          Tìm kiếm
        </Button>
        {isFiltering && (
          <Button variant="ghost" onClick={handleClear}>
            <X className="size-4" />
            Xoá bộ lọc
          </Button>
        )}
      </div>

      {/* Bulk action bar */}
      <div className="bg-muted/50 border-divider flex flex-wrap items-start gap-3 rounded-lg border p-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="text-foreground shrink-0 text-sm font-medium">
            {selectedStudents.length > 0
              ? `Đã chọn ${selectedStudents.length} học sinh:`
              : 'Chưa chọn học sinh nào'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedStudents.map((s) => (
              <Badge
                key={s.studentId}
                variant="secondary"
                className="cursor-pointer gap-1 pr-1"
                onClick={() => toggleOne(s.studentId)}
              >
                {s.fullName ?? s.email}
                <X className="size-3" />
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="default"
            disabled={selectedStudents.length === 0}
            onClick={() => setBulkDialog({ mode: 'mark', students: selectedStudents })}
          >
            <CheckCircle2 className="size-4" />
            Đánh dấu có mặt
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={selectedStudents.length === 0}
            onClick={() => setBulkDialog({ mode: 'remove', students: selectedStudents })}
          >
            <ClipboardX className="size-4" />
            Huỷ điểm danh
          </Button>
          {selectedStudents.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Bỏ chọn
            </Button>
          )}
        </div>
      </div>

      <div className="border-divider overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 text-center">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleAll}
                  aria-label="Chọn tất cả"
                />
              </TableHead>
              <TableHead className="min-w-45">Họ tên học sinh</TableHead>
              <TableHead className="w-20 text-center">Xin nghỉ</TableHead>
              <TableHead className="min-w-45">Lý do nghỉ</TableHead>
              {sessions.map((s, idx) => (
                <SessionColumnHead key={s.id} idx={idx} />
              ))}
              <TableHead className="w-16 text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-muted-foreground text-center">
                  {studentRows.length === 0
                    ? 'Chưa có học sinh trong lớp'
                    : 'Không tìm thấy học sinh phù hợp'}
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((row) => (
                <TableRow
                  key={row.studentId}
                  data-state={selectedIds.has(row.studentId) ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => toggleOne(row.studentId)}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(row.studentId)}
                      onCheckedChange={() => toggleOne(row.studentId)}
                      aria-label={`Chọn ${row.fullName ?? row.email}`}
                    />
                  </TableCell>
                  <TableCell className="text-foreground font-medium">
                    {row.fullName ?? row.email}
                    {row.fullName && (
                      <div className="text-muted-foreground text-xs">{row.email}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
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

      {/* Pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border-input bg-background rounded-md border px-2 py-1 text-sm focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span>/ {filteredRows.length} học sinh</span>
        </div>
        <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />
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

      {bulkDialog && (
        <BulkAttendanceDialog
          open
          mode={bulkDialog.mode}
          classSessionId={classSessionId}
          students={bulkDialog.students}
          attendanceSessions={sessions}
          onOpenChange={(open) => {
            if (!open) setBulkDialog(null);
          }}
          onSuccess={() => {
            setBulkDialog(null);
            clearSelection();
            onChanged();
          }}
        />
      )}
    </>
  );
}

function SessionColumnHead({ idx }: { idx: number }) {
  return (
    <>
      <TableHead className="min-w-30 text-center">
        Phiên #{idx + 1}
        <div className="text-muted-foreground text-[10px] font-normal normal-case">
          Đã điểm danh
        </div>
      </TableHead>
      <TableHead className="min-w-25 text-center">
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

interface BulkAttendanceDialogProps {
  open: boolean;
  mode: BulkMode;
  classSessionId: number;
  students: AttendanceSummaryStudent[];
  attendanceSessions: import('@/types/actions/attendance').AttendanceSessionListRow[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function BulkAttendanceDialog({
  open,
  mode,
  classSessionId,
  students,
  attendanceSessions,
  onOpenChange,
  onSuccess,
}: BulkAttendanceDialogProps) {
  const sortedSessions = useMemo(
    () =>
      [...attendanceSessions].sort(
        (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
      ),
    [attendanceSessions],
  );

  const [sessionId, setSessionId] = useState<string>(
    sortedSessions[0] ? String(sortedSessions[0].id) : '',
  );
  const [loading, setLoading] = useState(false);

  const title = mode === 'mark' ? 'Đánh dấu có mặt hàng loạt' : 'Huỷ điểm danh hàng loạt';
  const action = mode === 'mark' ? 'MARK_ATTENDED' : 'REMOVE_ATTENDANCE';
  const successMsg = mode === 'mark' ? 'Đã đánh dấu có mặt' : 'Đã huỷ điểm danh';
  const noSession = sortedSessions.length === 0;

  const handleSubmit = async () => {
    if (noSession || !sessionId) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        students.map((s) =>
          manualAttendanceAction(classSessionId, {
            studentId: s.studentId,
            action,
            attendanceSessionId: Number(sessionId),
          }),
        ),
      );
      const errors = results.flatMap((r) => r.errors);
      handleActionResult(errors, onSuccess, `${successMsg} ${students.length} học sinh`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-2 block text-sm">Học sinh được chọn ({students.length})</Label>
            <div className="flex flex-wrap gap-1.5">
              {students.map((s) => (
                <Badge key={s.studentId} variant="secondary">
                  {s.fullName ?? s.email}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Phiên điểm danh</Label>
            {noSession ? (
              <p className="text-sm text-red-500">
                Chưa có phiên điểm danh nào. Vui lòng bật điểm danh trước.
              </p>
            ) : (
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Chọn phiên" />
                </SelectTrigger>
                <SelectContent>
                  {sortedSessions.map((s, idx) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      Phiên #{sortedSessions.length - idx} —{' '}
                      {formatDateTimeShort(s.openedAt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={loading || noSession}>
            {loading ? 'Đang lưu...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
