'use client';

import { useState, useTransition } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
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
import { removeStudentAction } from '@/actions/v1/classes/remove-student';
import { handleActionResult } from '@/lib/actions';
import { formatDate } from '@/lib/utils';
import type { ClassStudentListRow } from '@/types/actions/class-management';

const SKELETON_COLUMNS = ['w-8', 'w-48', 'w-36', 'w-24', 'w-28'];

interface Props {
  classId: number;
  rows: ClassStudentListRow[];
  loading?: boolean;
}

export default function ClassStudentsTable({ classId, rows, loading }: Props) {
  const [target, setTarget] = useState<ClassStudentListRow | null>(null);
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
            <TableHead>Ngày thêm</TableHead>
            <TableHead className="w-40 text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeleton columnWidths={SKELETON_COLUMNS} />
          ) : (
            rows.map((s) => (
              <TableRow key={s.studentId}>
                <TableCell className="text-muted-foreground">{s.studentId}</TableCell>
                <TableCell className="text-foreground font-medium">{s.email}</TableCell>
                <TableCell>{s.fullName ?? '—'}</TableCell>
                <TableCell>{formatDate(s.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive cursor-pointer"
                    onClick={() => setTarget(s)}
                    disabled={pending}
                  >
                    <Trash2 /> Xoá khỏi lớp
                  </Button>
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
    </>
  );
}
