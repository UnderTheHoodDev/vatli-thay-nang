'use client';

import { useMemo, useState, useTransition } from 'react';
import { CalendarCog, RotateCcw, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import AttendanceSummaryCell from './AttendanceSummaryCell';
import ClassStudentStatusBadge from './ClassStudentStatusBadge';
import EnrollmentDateModal from './EnrollmentDateModal';
import MarkStudentLeftModal from './MarkStudentLeftModal';
import { removeStudentAction } from '@/actions/v1/classes/remove-student';
import { restoreStudentAction } from '@/actions/v1/classes/restore-student';
import { handleActionResult } from '@/lib/actions';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ClassAttendanceStudentRow } from '@/types/actions/attendance';
import type { ClassStudentListRow } from '@/types/actions/class-management';

const SKELETON_COLUMNS = ['w-8', 'w-48', 'w-36', 'w-28', 'w-28', 'w-24', 'w-32', 'w-44'];

interface Props {
  classId: number;
  rows: ClassStudentListRow[];
  attendanceStats?: ClassAttendanceStudentRow[];
  loading?: boolean;
}

export default function ClassStudentsTable({ classId, rows, attendanceStats, loading }: Props) {
  const attendanceByStudent = useMemo(
    () => new Map((attendanceStats ?? []).map((s) => [s.studentId, s])),
    [attendanceStats],
  );
  const [target, setTarget] = useState<ClassStudentListRow | null>(null);
  const [editingEnrollment, setEditingEnrollment] = useState<ClassStudentListRow | null>(null);
  const [markingLeft, setMarkingLeft] = useState<ClassStudentListRow | null>(null);
  const [restoring, setRestoring] = useState<ClassStudentListRow | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmRemove() {
    if (!target) return;
    const studentId = target.studentId;
    startTransition(async () => {
      const res = await removeStudentAction(classId, studentId);
      const ok = handleActionResult(res.errors, undefined, 'Đã xoá học sinh khỏi lớp');
      if (ok) setTarget(null);
    });
  }

  function confirmRestore() {
    if (!restoring) return;
    const studentId = restoring.studentId;
    startTransition(async () => {
      const res = await restoreStudentAction(classId, studentId);
      const ok = handleActionResult(res.errors, undefined, 'Đã khôi phục trạng thái đang học');
      if (ok) setRestoring(null);
    });
  }

  if (!loading && rows.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="Chưa có học sinh nào trong lớp"
        description='Sử dụng nút "Thêm học sinh" ở trên để bắt đầu thêm học sinh vào lớp.'
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-14">ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Họ và tên</TableHead>
            <TableHead>Ngày vào học</TableHead>
            <TableHead>Ngày nghỉ học</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Chuyên cần</TableHead>
            <TableHead className="w-44 text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton columnWidths={SKELETON_COLUMNS} />
          ) : (
            rows.map((s) => (
              <TableRow key={s.studentId} className={cn(s.status === 'LEFT' && 'opacity-60')}>
                <TableCell className="text-muted-foreground">{s.studentId}</TableCell>
                <TableCell className="text-foreground font-medium">{s.email}</TableCell>
                <TableCell>{s.fullName ?? '—'}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDate(s.enrollmentDate ?? s.createdAt)}
                  {!s.enrollmentDate && (
                    <span className="text-muted-foreground ml-1 text-xs">(theo ngày thêm)</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatDate(s.leftAt)}
                </TableCell>
                <TableCell>
                  <ClassStudentStatusBadge status={s.status} />
                </TableCell>
                <TableCell>
                  <AttendanceSummaryCell stats={attendanceByStudent.get(s.studentId)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Sửa ngày vào học"
                      className="cursor-pointer"
                      disabled={pending}
                      onClick={() => setEditingEnrollment(s)}
                    >
                      <CalendarCog />
                    </Button>
                    {s.status === 'STUDYING' ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Đánh dấu nghỉ học"
                        className="cursor-pointer"
                        disabled={pending}
                        onClick={() => setMarkingLeft(s)}
                      >
                        <UserMinus />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Khôi phục trạng thái đang học"
                        className="cursor-pointer"
                        disabled={pending}
                        onClick={() => setRestoring(s)}
                      >
                        <RotateCcw />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Xoá khỏi lớp"
                      className="text-destructive hover:text-destructive cursor-pointer"
                      disabled={pending}
                      onClick={() => setTarget(s)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá học sinh</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá học sinh{' '}
              <span className="text-foreground font-medium">
                {target?.fullName ?? target?.email}
              </span>{' '}
              khỏi lớp này không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRemove();
              }}
              disabled={pending}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {pending ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoring !== null} onOpenChange={(open) => !open && setRestoring(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục trạng thái đang học</AlertDialogTitle>
            <AlertDialogDescription>
              Đưa{' '}
              <span className="text-foreground font-medium">
                {restoring?.fullName ?? restoring?.email}
              </span>{' '}
              về trạng thái đang học? Ngày nghỉ học đã ghi trước đó sẽ bị xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRestore();
              }}
              disabled={pending}
              className="cursor-pointer"
            >
              {pending ? 'Đang xử lý...' : 'Khôi phục'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingEnrollment && (
        <EnrollmentDateModal
          classId={classId}
          student={editingEnrollment}
          open
          onOpenChange={(o) => !o && setEditingEnrollment(null)}
        />
      )}
      {markingLeft && (
        <MarkStudentLeftModal
          classId={classId}
          student={markingLeft}
          open
          onOpenChange={(o) => !o && setMarkingLeft(null)}
        />
      )}
    </>
  );
}
