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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { handleActionResult } from '@/lib/actions';
import { createClassSessionAction } from '@/actions/v1/class-sessions/create-class-session';
import { updateClassSessionAction } from '@/actions/v1/class-sessions/update-class-session';
import type { ClassSessionListRow } from '@/types/actions/class-management';
import type { ClassRow } from '@/types/class-management';

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  /** Bắt buộc khi không truyền `classes` (modal mở từ trong ngữ cảnh 1 lớp cố định). */
  classId?: number;
  /** Truyền vào khi modal mở ở nơi không gắn với 1 lớp cố định (VD: trang danh sách buổi học) — hiện thêm dropdown chọn lớp. */
  classes?: ClassRow[];
  initialData?: ClassSessionListRow;
}

export default function ClassSessionFormModal({
  open,
  onOpenChange,
  mode,
  classId,
  classes,
  initialData,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(classId ?? null);

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [startTime, setStartTime] = useState(
    initialData?.startTime ? toLocalDatetimeValue(initialData.startTime) : '',
  );
  const [endTime, setEndTime] = useState(
    initialData?.endTime ? toLocalDatetimeValue(initialData.endTime) : '',
  );
  const [meetingUrl, setMeetingUrl] = useState(initialData?.meetingUrl ?? '');

  const nowValue = toLocalDatetimeValue(new Date().toISOString());

  const classError = submitted && classes && !selectedClassId ? 'Vui lòng chọn lớp' : '';
  const titleError = submitted && !title.trim() ? 'Vui lòng nhập tiêu đề' : '';
  const startTimeError =
    submitted && !startTime
      ? 'Vui lòng chọn thời gian bắt đầu'
      : submitted && startTime && new Date(startTime) < new Date()
        ? 'Thời gian bắt đầu phải từ thời điểm hiện tại trở đi'
        : '';
  const endTimeError =
    submitted && !endTime
      ? 'Vui lòng chọn thời gian kết thúc'
      : submitted && endTime && new Date(endTime) < new Date()
        ? 'Thời gian kết thúc phải từ thời điểm hiện tại trở đi'
        : submitted && startTime && endTime && new Date(endTime) <= new Date(startTime)
          ? 'Thời gian kết thúc phải sau thời gian bắt đầu'
          : '';

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!title.trim() || !startTime || !endTime) return;
    if (classes && !selectedClassId) return;
    const now = new Date();
    if (new Date(startTime) < now) return;
    if (new Date(endTime) < now) return;
    if (new Date(endTime) <= new Date(startTime)) return;

    const effectiveClassId = selectedClassId ?? classId;
    if (!effectiveClassId) return;

    setLoading(true);
    try {
      if (mode === 'create') {
        const result = await createClassSessionAction(effectiveClassId, {
          title: title.trim(),
          description: description.trim() || undefined,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          meetingUrl: meetingUrl.trim() || undefined,
        });
        handleActionResult(
          result.errors,
          () => {
            onOpenChange(false);
            router.refresh();
          },
          'Tạo buổi học thành công',
        );
      } else if (initialData) {
        const result = await updateClassSessionAction(initialData.id, effectiveClassId, {
          title: title.trim(),
          description: description.trim() || undefined,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          meetingUrl: meetingUrl.trim() || undefined,
        });
        handleActionResult(
          result.errors,
          () => {
            onOpenChange(false);
            router.refresh();
          },
          'Cập nhật buổi học thành công',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Tạo buổi học' : 'Chỉnh sửa buổi học'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {classes && (
            <div>
              <Label>
                Lớp <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedClassId ? String(selectedClassId) : ''}
                onValueChange={(v) => setSelectedClassId(Number(v))}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="font-mono text-xs">{c.code}</span> — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {classError && <p className="mt-1 text-xs text-red-500">{classError}</p>}
            </div>
          )}

          <div>
            <Label htmlFor="session-title">
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="session-title"
              placeholder="VD: Buổi 1 - Động lực học"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {titleError && <p className="mt-1 text-xs text-red-500">{titleError}</p>}
          </div>

          <div>
            <Label htmlFor="session-desc">Mô tả</Label>
            <textarea
              id="session-desc"
              className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
              placeholder="Mô tả buổi học (không bắt buộc)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session-start">
                Bắt đầu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="session-start"
                type="datetime-local"
                min={nowValue}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              {startTimeError && <p className="mt-1 text-xs text-red-500">{startTimeError}</p>}
            </div>
            <div>
              <Label htmlFor="session-end">
                Kết thúc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="session-end"
                type="datetime-local"
                min={nowValue}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
              {endTimeError && <p className="mt-1 text-xs text-red-500">{endTimeError}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="session-meeting-url">Link meeting</Label>
            <Input
              id="session-meeting-url"
              placeholder="https://meet.google.com/..."
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
