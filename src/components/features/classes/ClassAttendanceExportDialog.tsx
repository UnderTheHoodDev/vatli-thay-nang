'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ActionButton } from '@/components/ui/custom';
import { useAttendanceExport } from '@/hooks/useAttendanceExport';

interface Props {
  classId: number;
}

export default function ClassAttendanceExportDialog({ classId }: Props) {
  const [open, setOpen] = useState(false);
  const { from, setFrom, to, setTo, format, setFormat, loading, handleExport } =
    useAttendanceExport([classId]);

  async function handleExportAndClose() {
    if (await handleExport()) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          <Download /> Xuất điểm danh
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xuất điểm danh lớp học</DialogTitle>
          <DialogDescription>Chọn khoảng thời gian và định dạng file cần xuất.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="class-export-from">Từ ngày</Label>
              <Input
                id="class-export-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="class-export-to">Đến ngày</Label>
              <Input
                id="class-export-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Định dạng</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as 'csv' | 'xlsx')}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="csv" id="class-export-format-csv" />
                <Label htmlFor="class-export-format-csv" className="cursor-pointer font-normal">
                  CSV
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="xlsx" id="class-export-format-xlsx" />
                <Label htmlFor="class-export-format-xlsx" className="cursor-pointer font-normal">
                  Excel
                </Label>
              </div>
            </RadioGroup>
          </div>
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
            onClick={handleExportAndClose}
            isLoading={loading}
            loadingText="Đang xuất..."
            className="cursor-pointer"
          >
            <Download className="size-4" /> Tải xuống
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
