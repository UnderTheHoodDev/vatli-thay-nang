'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { updateEnrollmentDateAction } from '@/actions/v1/classes/update-enrollment-date';
import { toDateInputValue } from '@/lib/format';
import type { ClassStudentListRow } from '@/types/actions/class-management';

interface Props {
  classId: number;
  student: ClassStudentListRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EnrollmentDateModal({ classId, student, open, onOpenChange }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // enrollmentDate chưa đặt -> mặc định là ngày được thêm vào lớp.
  const [value, setValue] = useState(toDateInputValue(student.enrollmentDate ?? student.createdAt));

  const error = submitted && !value ? 'Vui lòng chọn ngày vào học' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!value) return;

    setLoading(true);
    try {
      const res = await updateEnrollmentDateAction(classId, student.studentId, {
        enrollmentDate: value,
      });
      handleActionResult(
        res.errors,
        () => {
          onOpenChange(false);
          router.refresh();
        },
        'Cập nhật ngày vào học thành công',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa ngày vào học</DialogTitle>
          <DialogDescription>
            {student.fullName ?? student.email} — ngày này quyết định buổi học nào được tính vào học
            phí của học sinh.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="enrollment-date">
              Ngày vào học <span className="text-destructive">*</span>
            </Label>
            <Input
              id="enrollment-date"
              type="date"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={!!error}
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
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
              isLoading={loading}
              loadingText="Đang lưu..."
              className="cursor-pointer"
            >
              Lưu
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
