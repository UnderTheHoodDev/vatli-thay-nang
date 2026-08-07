'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActionButton } from '@/components/ui/custom';
import { handleActionErrors } from '@/lib/actions';
import { downloadBlob } from '@/lib/download';
import { formatDateTime } from '@/lib/format';
import { listClassSessions } from '@/actions/v1/class-sessions/list-class-sessions';
import { exportTuitionAction } from '@/actions/v1/tuition/export-tuition';
import type { ClassSessionListRow } from '@/types/actions/class-management';
import type { TuitionExportMode } from '@/types/actions/tuition';

interface Props {
  classId: number;
  year: number;
  month: number;
}

function SessionSelect({
  label,
  sessions,
  value,
  onChange,
}: {
  label: string;
  sessions: ClassSessionListRow[];
  value: number | undefined;
  onChange: (id: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value ? String(value) : undefined} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="cursor-pointer">
          <SelectValue placeholder="Chọn buổi" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.title} — {formatDateTime(s.startTime)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function TuitionExportDialog({ classId, year, month }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<TuitionExportMode>('month');
  const [sessions, setSessions] = useState<ClassSessionListRow[]>([]);
  const [fromSessionId, setFromSessionId] = useState<number | undefined>(undefined);
  const [toSessionId, setToSessionId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || mode !== 'range' || sessions.length > 0) return;
    // 200 = pageSize tối đa BE cho phép (ListClassSessionsQueryDto).
    listClassSessions(classId, { page: 1, pageSize: 200 }).then((res) => {
      setSessions(res.data);
      if (res.data.length) {
        setFromSessionId(res.data[0].id);
        setToSessionId(res.data[res.data.length - 1].id);
      }
    });
  }, [open, mode, sessions.length, classId]);

  async function handleExport() {
    if (mode === 'range' && (!fromSessionId || !toSessionId)) return;
    setLoading(true);
    try {
      const res = await exportTuitionAction({
        classId,
        mode,
        year,
        month,
        fromSessionId: mode === 'range' ? fromSessionId : undefined,
        toSessionId: mode === 'range' ? toSessionId : undefined,
      });
      if (res.errors.length) {
        handleActionErrors(res.errors);
        return;
      }
      if (!res.blob) return;

      downloadBlob(res.blob, res.filename);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          <Download /> Xuất Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xuất bảng học phí ra Excel</DialogTitle>
          <DialogDescription>
            Học phí luôn theo tháng {month}/{year} đang xem — chế độ dưới đây chỉ thu hẹp các cột
            buổi học hiển thị trong file.
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground -mt-2 text-xs">
          Cột buổi: <span className="font-medium">✓</span> có điểm danh, trống — chưa điểm danh
          (kể cả nghỉ phép — vẫn tính tiền, ghi chú thêm ở cột &quot;Ghi chú&quot; nếu cần).
        </p>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Cột buổi học</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as TuitionExportMode)}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="month" id="tuition-export-month" />
                <Label htmlFor="tuition-export-month" className="cursor-pointer font-normal">
                  Theo tháng
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="range" id="tuition-export-range" />
                <Label htmlFor="tuition-export-range" className="cursor-pointer font-normal">
                  Theo dải buổi
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === 'range' && (
            <div className="grid grid-cols-2 gap-4">
              <SessionSelect
                label="Từ buổi"
                sessions={sessions}
                value={fromSessionId}
                onChange={setFromSessionId}
              />
              <SessionSelect
                label="Đến buổi"
                sessions={sessions}
                value={toSessionId}
                onChange={setToSessionId}
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="cursor-pointer"
          >
            Huỷ
          </Button>
          <ActionButton
            onClick={handleExport}
            isLoading={loading}
            loadingText="Đang xuất..."
            disabled={mode === 'range' && (!fromSessionId || !toSessionId)}
            className="cursor-pointer"
          >
            <Download className="size-4" /> Tải xuống
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
