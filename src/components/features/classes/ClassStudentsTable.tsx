'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ActionButton } from '@/components/ui/custom';
import { removeStudentAction } from '@/actions/v1/classes/remove-student';
import { handleActionResult } from '@/lib/actions';
import { formatDate } from '@/lib/utils';
import type { ClassStudentListRow } from '@/types/actions/class-management';

interface Props {
  classId: number;
  rows: ClassStudentListRow[];
}

export default function ClassStudentsTable({ classId, rows }: Props) {
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

  return (
    <>
      <div className="border-divider rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Ngày thêm</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-gray-400">
                  Chưa có học sinh nào trong lớp
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell>{s.studentId}</TableCell>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell>{s.fullName ?? '-'}</TableCell>
                  <TableCell>{formatDate(s.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
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
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xoá học sinh</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xoá học sinh{' '}
              <span className="font-medium">{target?.fullName ?? target?.email}</span> khỏi lớp này
              không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTarget(null)}
              disabled={pending}
            >
              Huỷ
            </Button>
            <ActionButton
              type="button"
              variant="destructive"
              onClick={confirmRemove}
              isLoading={pending}
              loadingText="Đang xoá..."
            >
              Xoá
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
