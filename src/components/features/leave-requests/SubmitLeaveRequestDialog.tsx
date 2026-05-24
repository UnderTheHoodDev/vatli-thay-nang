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
import { ActionButton } from '@/components/ui/custom/ActionButton';
import { Button } from '@/components/ui/button';
import { handleActionResult } from '@/lib/actions';
import { submitLeaveRequestAction } from '@/actions/v1/leave-requests/submit-leave-request';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classSessionId: number;
}

export default function SubmitLeaveRequestDialog({ open, onOpenChange, classSessionId }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const result = await submitLeaveRequestAction(classSessionId, { reason: reason.trim() });
      handleActionResult(
        result.errors,
        () => {
          setReason('');
          onOpenChange(false);
          router.refresh();
        },
        'Gửi yêu cầu xin nghỉ thành công',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xin nghỉ buổi học</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do xin nghỉ</Label>
            <Textarea
              id="reason"
              placeholder="Nhập lý do xin nghỉ..."
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
            loadingText="Đang gửi..."
          >
            Gửi yêu cầu
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
