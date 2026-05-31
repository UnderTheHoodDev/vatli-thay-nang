'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ActionButton } from '@/components/ui/custom/ActionButton';
import { Button } from '@/components/ui/button';
import { handleActionResult } from '@/lib/actions';
import { submitLeaveRequestAction } from '@/actions/v1/leave-requests/submit-leave-request';
import { updateLeaveRequestAction } from '@/actions/v1/leave-requests/update-leave-request';
import type { LeaveType } from '@/types/class-management';

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string; description: string }[] = [
  {
    value: 'FULL_SESSION',
    label: 'Nghỉ cả buổi',
    description: 'Không tham gia buổi học này',
  },
  {
    value: 'EARLY_LEAVE',
    label: 'Xin rời sớm',
    description: 'Tham gia nhưng cần rời trước khi buổi học kết thúc',
  },
];

interface ExistingLeaveRequest {
  id: number;
  reason: string;
  leaveType: LeaveType;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classSessionId: number;
  existingLeaveRequest?: ExistingLeaveRequest | null;
}

interface FormProps {
  onOpenChange: (open: boolean) => void;
  classSessionId: number;
  existingLeaveRequest?: ExistingLeaveRequest | null;
}

/** State được khởi tạo từ props khi remount — không dùng useEffect để tránh cascading render */
function LeaveRequestFormContent({
  onOpenChange,
  classSessionId,
  existingLeaveRequest,
}: FormProps) {
  const router = useRouter();
  const isEditMode = !!existingLeaveRequest;

  const [reason, setReason] = useState(existingLeaveRequest?.reason ?? '');
  const [leaveType, setLeaveType] = useState<LeaveType>(
    existingLeaveRequest?.leaveType ?? 'FULL_SESSION',
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const result = isEditMode
        ? await updateLeaveRequestAction(existingLeaveRequest.id, {
            reason: reason.trim(),
            leaveType,
          })
        : await submitLeaveRequestAction(classSessionId, {
            reason: reason.trim(),
            leaveType,
          });

      handleActionResult(
        result.errors,
        () => {
          onOpenChange(false);
          router.refresh();
        },
        isEditMode ? 'Cập nhật đơn xin nghỉ thành công' : 'Gửi yêu cầu xin nghỉ thành công',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Chỉnh sửa đơn xin nghỉ' : 'Xin nghỉ buổi học'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Loại nghỉ</Label>
          <RadioGroup
            value={leaveType}
            onValueChange={(v) => setLeaveType(v as LeaveType)}
            className="gap-2"
            disabled={loading}
          >
            {LEAVE_TYPE_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                className="has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
              >
                <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" />
                <Label htmlFor={opt.value} className="cursor-pointer space-y-0.5">
                  <span className="font-medium">{opt.label}</span>
                  <p className="text-muted-foreground text-xs font-normal">{opt.description}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Lý do</Label>
          <Textarea
            id="reason"
            placeholder="Nhập lý do..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            disabled={loading}
          />
          <p className="text-muted-foreground text-xs">{reason.length}/500 ký tự</p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Huỷ
        </Button>
        <ActionButton
          onClick={handleSubmit}
          isLoading={loading}
          disabled={!reason.trim()}
          loadingText={isEditMode ? 'Đang lưu...' : 'Đang gửi...'}
        >
          {isEditMode ? 'Lưu thay đổi' : 'Gửi yêu cầu'}
        </ActionButton>
      </DialogFooter>
    </>
  );
}

export default function SubmitLeaveRequestDialog({
  open,
  onOpenChange,
  classSessionId,
  existingLeaveRequest,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" key={existingLeaveRequest?.id ?? 'new'}>
        <LeaveRequestFormContent
          onOpenChange={onOpenChange}
          classSessionId={classSessionId}
          existingLeaveRequest={existingLeaveRequest}
        />
      </DialogContent>
    </Dialog>
  );
}
