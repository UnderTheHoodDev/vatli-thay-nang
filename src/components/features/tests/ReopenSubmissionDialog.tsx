'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { handleActionResult } from '@/lib/actions';
import { reopenSubmissionAction } from '@/actions/v1/tests/reopen-submission';
import type { SubmissionRow } from '@/types/tests';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  testId: number;
  maxScore: number;
  row: SubmissionRow;
  onSaved: () => void;
}

/** ISO → giá trị cho input datetime-local (giờ máy). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Mặc định: cuối ngày hôm nay — hạn hay dùng nhất khi cho nộp bù. */
function endOfToday(): string {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  return toLocalInput(d.toISOString());
}

export default function ReopenSubmissionDialog({
  open,
  onOpenChange,
  courseId,
  testId,
  maxScore,
  row,
  onSaved,
}: Props) {
  const router = useRouter();
  const [until, setUntil] = useState(
    row.reopen ? toLocalInput(row.reopen.reopenUntil) : endOfToday(),
  );
  const [reason, setReason] = useState(row.reopen?.reason ?? '');
  const [saving, setSaving] = useState(false);
  // Kiểm tra mốc thời gian ở handler, không phải lúc render: so với Date.now() trong
  // render là gọi hàm không thuần, kết quả đổi theo mỗi lần render lại.
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (new Date(until).getTime() <= Date.now()) {
      setError('Hạn nộp bù phải ở tương lai.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await reopenSubmissionAction(courseId, testId, row.studentId, {
        reopenUntil: new Date(until).toISOString(),
        reason: reason.trim() || undefined,
      });
      const ok = handleActionResult(
        res.errors,
        () => router.refresh(),
        'Đã mở lại bài cho học sinh',
      );
      if (ok) {
        onSaved();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row.reopen ? 'Sửa hạn nộp bù' : 'Mở lại bài để nộp bù'}</DialogTitle>
          <DialogDescription>
            {row.fullName ?? row.email} sẽ nộp được tới mốc dưới đây, kể cả khi bài đã kết thúc.
            Đồng hồ làm bài không áp dụng trong khoảng này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nộp đè xoá điểm + nhận xét cũ (quy tắc sẵn có khi nộp lại) — phải nói trước. */}
          {row.status !== 'NOT_SUBMITTED' && (
            <div className="border-destructive/30 bg-destructive/5 text-foreground space-y-1 rounded-md border px-3 py-2 text-sm">
              <p className="font-medium">Em này đã nộp bài rồi.</p>
              <p>
                Nếu em ấy nộp đè bài mới, bài cũ bị thay
                {row.status === 'GRADED' && row.score !== null ? (
                  <>
                    {' '}
                    và{' '}
                    <strong>
                      điểm {row.score}/{maxScore} cùng nhận xét sẽ bị xoá
                    </strong>{' '}
                    để chấm lại từ đầu
                  </>
                ) : null}
                .
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="reopen-until">Nộp được đến</Label>
            <Input
              id="reopen-until"
              type="datetime-local"
              value={until}
              onChange={(e) => {
                setUntil(e.target.value);
                setError(null);
              }}
              disabled={saving}
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reopen-reason">Lý do (không bắt buộc)</Label>
            <Textarea
              id="reopen-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: em bị ốm, đã báo trước"
              maxLength={500}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Huỷ
          </Button>
          <Button className="cursor-pointer" disabled={saving || !until} onClick={submit}>
            {saving ? 'Đang lưu...' : row.reopen ? 'Lưu hạn mới' : 'Mở lại bài'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
