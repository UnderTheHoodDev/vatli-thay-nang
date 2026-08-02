'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ActionButton } from '@/components/ui/custom';
import { handleActionErrors, handleActionResult } from '@/lib/actions';
import { formatAmountVnd, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { importTuitionPreviewAction } from '@/actions/v1/tuition/import-tuition-preview';
import { importTuitionConfirmAction } from '@/actions/v1/tuition/import-tuition-confirm';
import type { TuitionImportPreviewRow } from '@/types/actions/tuition';

interface Props {
  classId: number;
  year: number;
  month: number;
}

function isRowValid(r: TuitionImportPreviewRow): boolean {
  return r.matched && r.rowErrors.length === 0 && r.studentId !== null;
}

export default function TuitionImportDialog({ classId, year, month }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<TuitionImportPreviewRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const validRows = useMemo(() => rows?.filter(isRowValid) ?? [], [rows]);

  function reset() {
    setFile(null);
    setRows(null);
  }

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', String(classId));
      const res = await importTuitionPreviewAction(formData);
      if (res.errors.length) {
        handleActionErrors(res.errors);
        return;
      }
      setRows(res.data?.rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (validRows.length === 0) return;

    setLoading(true);
    try {
      const res = await importTuitionConfirmAction({
        classId,
        year,
        month,
        rows: validRows.map((r) => ({
          studentId: r.studentId as number,
          sessionChanges: r.sessionChanges,
          amountDue: r.amountDue ?? undefined,
          amountPaid: r.amountPaid ?? undefined,
          paidDate: r.paidDate,
          note: r.note,
        })),
      });
      const ok = handleActionResult(
        res.errors,
        () => router.refresh(),
        `Đã đồng bộ ${res.data?.updated ?? 0} thay đổi`,
      );
      if (ok) {
        setOpen(false);
        reset();
      }
    } finally {
      setLoading(false);
    }
  }

  const validCount = validRows.length;
  const invalidCount = (rows?.length ?? 0) - validCount;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          <Upload /> Nhập Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nhập học phí từ Excel</DialogTitle>
          <DialogDescription>
            Chọn file .xlsx đã xuất (có thể đã chỉnh sửa) để xem trước thay đổi trước khi đồng bộ
            vào tháng {month}/{year}.
          </DialogDescription>
        </DialogHeader>

        {!rows ? (
          <div className="py-2">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="border-input-border w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">
              {validCount} dòng hợp lệ sẽ được đồng bộ
              {invalidCount > 0 && `, ${invalidCount} dòng lỗi sẽ bị bỏ qua`}
            </p>
            <div className="max-h-80 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Email</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Buổi thay đổi</TableHead>
                    <TableHead>Phải đóng</TableHead>
                    <TableHead>Đã đóng</TableHead>
                    <TableHead>Ngày đóng</TableHead>
                    <TableHead>Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={cn(r.rowErrors.length > 0 && 'bg-destructive/5')}>
                      <TableCell className="text-xs">{r.email}</TableCell>
                      <TableCell className="text-xs">{r.fullName ?? '—'}</TableCell>
                      <TableCell className="text-xs">
                        {r.sessionChanges.length > 0 ? r.sessionChanges.length : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.amountDue != null ? formatAmountVnd(r.amountDue) : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.amountPaid != null ? formatAmountVnd(r.amountPaid) : '—'}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.paidDate ? formatDate(r.paidDate) : '—'}
                      </TableCell>
                      <TableCell className="text-destructive text-xs">
                        {r.rowErrors.join(', ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

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
          {!rows ? (
            <ActionButton
              onClick={handlePreview}
              isLoading={loading}
              loadingText="Đang xem trước..."
              disabled={!file}
              className="cursor-pointer"
            >
              Xem trước
            </ActionButton>
          ) : (
            <ActionButton
              onClick={handleConfirm}
              isLoading={loading}
              loadingText="Đang đồng bộ..."
              disabled={validCount === 0}
              className="cursor-pointer"
            >
              Xác nhận đồng bộ
            </ActionButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
