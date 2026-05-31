'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handleActionResult } from '@/lib/actions';
import { openAttendanceAction } from '@/actions/v1/attendance/open-attendance';

const PRESETS = [5, 10, 15, 20];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classSessionId: number;
  onOpened: () => void;
}

export default function OpenAttendanceDialog({
  open,
  onOpenChange,
  classSessionId,
  onOpened,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bật điểm danh</DialogTitle>
        </DialogHeader>
        {open && (
          <OpenAttendanceForm
            classSessionId={classSessionId}
            onOpened={onOpened}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FormProps {
  classSessionId: number;
  onOpened: () => void;
  onCancel: () => void;
}

function OpenAttendanceForm({ classSessionId, onOpened, onCancel }: FormProps) {
  const [duration, setDuration] = useState('5');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const numericDuration = Number(duration);
  const isValid =
    Number.isInteger(numericDuration) && numericDuration >= 1 && numericDuration <= 60;
  const error = submitted && !isValid ? 'Vui lòng nhập số phút từ 1 đến 60' : '';

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isValid) return;
    setLoading(true);
    try {
      const result = await openAttendanceAction(classSessionId, {
        durationMinutes: numericDuration,
      });
      handleActionResult(result.errors, onOpened, `Đã bật điểm danh — ${numericDuration} phút`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4 py-2">
        <div>
          <Label htmlFor="attendance-duration">
            Thời lượng (phút) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="attendance-duration"
            type="number"
            min={1}
            max={60}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((n) => (
              <Button
                key={n}
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setDuration(String(n))}
              >
                {n} phút
              </Button>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Huỷ
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Đang bật...' : 'Xác nhận'}
        </Button>
      </DialogFooter>
    </>
  );
}
