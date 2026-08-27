'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButton } from '@/components/ui/custom';
import { handleActionErrors, handleActionSuccess } from '@/lib/actions';
import { markStudentLeftAction } from '@/actions/v1/classes/mark-student-left';
import { toDateInputValue, todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ClassStudentListRow } from '@/types/actions/class-management';

interface Props {
  classId: number;
  students: ClassStudentListRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkMarkStudentsLeftModal({
  classId,
  students,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(todayISO());

  const eligible = students.filter((s) => s.status === 'STUDYING');
  const alreadyLeftCount = students.length - eligible.length;

  const rows = eligible.map((s) => {
    const enrollmentBase = toDateInputValue(s.enrollmentDate ?? s.createdAt);
    const invalid = !!enrollmentBase && value < enrollmentBase;
    return { student: s, invalid };
  });
  const validStudents = rows.filter((r) => !r.invalid).map((r) => r.student);
  const invalidCount = rows.length - validStudents.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value || validStudents.length === 0) return;

    setLoading(true);
    try {
      const results = await Promise.all(
        validStudents.map(async (s) => ({
          student: s,
          res: await markStudentLeftAction(classId, s.studentId, { leftAt: value }),
        })),
      );
      const failed = results.filter((r) => r.res.errors.length > 0);
      const succeededCount = results.length - failed.length;

      if (succeededCount > 0) {
        handleActionSuccess(
          failed.length === 0
            ? `Đã đánh dấu nghỉ học cho ${succeededCount} học sinh`
            : `Đã đánh dấu nghỉ học cho ${succeededCount}/${results.length} học sinh`,
        );
      }
      failed.forEach((f) =>
        handleActionErrors(
          f.res.errors.map((msg) => `${f.student.fullName ?? f.student.email}: ${msg}`),
        ),
      );
      if (succeededCount > 0) {
        onOpenChange(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đánh dấu nghỉ học hàng loạt</DialogTitle>
          <DialogDescription>
            {eligible.length} học sinh sẽ rời lớp này hẳn.
            {alreadyLeftCount > 0 &&
              ` ${alreadyLeftCount} học sinh đã nghỉ học từ trước sẽ không bị ảnh hưởng.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-left-at">
              Ngày nghỉ học <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bulk-left-at"
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="border-divider max-h-48 overflow-y-auto rounded-md border">
            <ul className="divide-divider divide-y">
              {rows.map(({ student, invalid }) => (
                <li
                  key={student.studentId}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm',
                    invalid && 'opacity-60',
                  )}
                >
                  <span className="text-foreground">{student.fullName ?? student.email}</span>
                  {invalid && (
                    <span className="text-destructive shrink-0 text-xs">Vào học sau ngày này</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {invalidCount > 0 && (
            <p className="text-muted-foreground text-xs">
              {invalidCount} học sinh vào học sau ngày đã chọn sẽ bị bỏ qua.
            </p>
          )}

          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              Sau ngày này, các học sinh sẽ <strong>không được tính học phí</strong> ở các buổi học
              tiếp theo.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Huỷ
            </Button>
            <ActionButton
              type="submit"
              variant="destructive"
              isLoading={loading}
              loadingText="Đang xử lý..."
              disabled={validStudents.length === 0}
              className="cursor-pointer"
            >
              Xác nhận nghỉ học {validStudents.length > 0 ? `(${validStudents.length})` : ''}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
