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
import { handleActionResult } from '@/lib/actions';
import { markStudentLeftAction } from '@/actions/v1/classes/mark-student-left';
import { toDateInputValue, todayISO } from '@/lib/format';
import type { ClassStudentListRow } from '@/types/actions/class-management';

interface Props {
  classId: number;
  student: ClassStudentListRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MarkStudentLeftModal({ classId, student, open, onOpenChange }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [value, setValue] = useState(todayISO());

  const enrollmentBase = toDateInputValue(student.enrollmentDate ?? student.createdAt);
  const error = submitted && !value ? 'Vui lòng chọn ngày nghỉ học' : '';
  const beforeEnrollmentError =
    submitted && !error && enrollmentBase && value < enrollmentBase
      ? 'Ngày nghỉ phải sau ngày vào học'
      : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!value || (enrollmentBase && value < enrollmentBase)) return;

    setLoading(true);
    try {
      const res = await markStudentLeftAction(classId, student.studentId, { leftAt: value });
      handleActionResult(
        res.errors,
        () => {
          onOpenChange(false);
          router.refresh();
        },
        'Đã đánh dấu học sinh nghỉ học',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đánh dấu nghỉ học</DialogTitle>
          <DialogDescription>
            {student.fullName ?? student.email} sẽ rời lớp này hẳn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="left-at">
              Ngày nghỉ học <span className="text-destructive">*</span>
            </Label>
            <Input
              id="left-at"
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={!!(error || beforeEnrollmentError)}
            />
            {(error || beforeEnrollmentError) && (
              <p className="text-destructive text-xs">{error || beforeEnrollmentError}</p>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              Sau ngày này, học sinh sẽ <strong>không được tính học phí</strong> ở các buổi học tiếp
              theo. Học phí các tháng đã chốt không thay đổi cho tới khi bấm &quot;Tính lại&quot;.
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
              className="cursor-pointer"
            >
              Xác nhận nghỉ học
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
