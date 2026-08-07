'use client';

import { useState } from 'react';
import { Check, Loader2, RotateCcw, Undo2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TuitionStatusBadge from './TuitionStatusBadge';
import { useTuitionDrafts, type TuitionDraft } from './TuitionDraftsProvider';
import { handleActionErrors, handleActionResult } from '@/lib/actions';
import { updateTuitionAction } from '@/actions/v1/tuition/update-tuition';
import {
  computeTuitionDiff,
  deriveTuitionStatus,
  parseIntAmount,
  tuitionBaseDraft,
} from '@/lib/tuition';
import { todayISO } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TuitionListRow } from '@/types/actions/tuition';

interface Props {
  index: number;
  classId: number;
  row: TuitionListRow;
  /** Xoá nháp + router.refresh() trong CÙNG một transition (xem TuitionPageClient). */
  onSaved: (rowId: number) => void;
}

const CELL_INPUT = 'h-8 px-2 text-sm';

export default function TuitionRow({ index, classId, row, onSaved }: Props) {
  const { drafts, patch, discard } = useTuitionDrafts();
  const [saving, setSaving] = useState(false);

  const base = tuitionBaseDraft(row);
  const draft = drafts.get(row.id);
  const value = draft ?? base;
  const dirty = draft !== undefined;

  const due = parseIntAmount(value.amountDue);
  const paid = parseIntAmount(value.amountPaid);
  const dueInvalid = due === null;
  const paidInvalid = paid === null;

  // Badge cập nhật ngay khi gõ; ô nào hỏng thì rơi về số của server.
  const status = deriveTuitionStatus(due ?? row.amountDue, paid ?? row.amountPaid);

  const set = (next: Partial<TuitionDraft>) => patch(row.id, base, next);

  function markFullyPaid() {
    set({
      amountPaid: String(due ?? row.amountDue),
      paidDate: value.paidDate || todayISO(), // click-time, không phải render-time -> không lo hydration
    });
  }

  async function save() {
    if (saving || !dirty) return;
    if (due === null || paid === null) {
      handleActionErrors(['Số tiền phải là số nguyên không âm']);
      return;
    }

    const payload = computeTuitionDiff(base, value, due, paid);
    if (!payload) {
      discard(row.id); // gõ rồi gõ lại như cũ
      return;
    }

    setSaving(true);
    try {
      const res = await updateTuitionAction(row.id, classId, payload);
      handleActionResult(res.errors, () => onSaved(row.id), 'Đã lưu học phí');
    } finally {
      setSaving(false);
    }
  }

  async function clearOverride() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await updateTuitionAction(row.id, classId, { clearOverride: true });
      handleActionResult(res.errors, () => onSaved(row.id), 'Đã khôi phục số tự tính');
    } finally {
      setSaving(false);
    }
  }

  function onCellKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // isComposing: bộ gõ tiếng Việt dùng Enter để chốt từ gợi ý — đừng lưu nhầm giữa chừng.
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      discard(row.id);
      e.currentTarget.blur();
    }
  }

  return (
    <TableRow className={cn(dirty && 'bg-amber-50 hover:bg-amber-50')}>
      <TableCell className="text-muted-foreground">{index}</TableCell>
      <TableCell className="text-foreground font-medium">{row.fullName ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{row.email}</TableCell>

      <TableCell className="p-2">
        <div className="flex items-center justify-end gap-1">
          <Input
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            aria-label="Phải đóng"
            aria-invalid={dueInvalid}
            disabled={saving}
            className={cn(CELL_INPUT, 'w-32 text-right tabular-nums')}
            value={value.amountDue}
            onChange={(e) => set({ amountDue: e.target.value })}
            onKeyDown={onCellKeyDown}
          />
          {row.isDueOverridden && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground cursor-pointer"
              disabled={saving || dirty}
              title={
                dirty
                  ? 'Lưu hoặc huỷ thay đổi của dòng trước khi khôi phục'
                  : 'Khôi phục số tự tính theo các buổi học'
              }
              onClick={() => void clearOverride()}
            >
              <RotateCcw />
            </Button>
          )}
        </div>
        {row.isDueOverridden && (
          <p className="text-muted-foreground mt-0.5 pr-9 text-right text-[11px]">Đã sửa tay</p>
        )}
      </TableCell>

      <TableCell className="p-2">
        <div className="flex items-center justify-end gap-1">
          <Input
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            aria-label="Đã đóng"
            aria-invalid={paidInvalid}
            disabled={saving}
            className={cn(CELL_INPUT, 'w-32 text-right tabular-nums')}
            value={value.amountPaid}
            onChange={(e) => set({ amountPaid: e.target.value })}
            onKeyDown={onCellKeyDown}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={saving}
            className="cursor-pointer text-emerald-600 hover:text-emerald-700"
            title="Điền đủ số phải đóng"
            onClick={markFullyPaid}
          >
            <Check />
          </Button>
        </div>
      </TableCell>

      <TableCell>
        <TuitionStatusBadge
          status={status}
          amountDue={due ?? row.amountDue}
          amountPaid={paid ?? row.amountPaid}
          pending={dirty}
        />
      </TableCell>

      <TableCell className="p-2">
        <Input
          type="date"
          aria-label="Ngày đóng"
          disabled={saving}
          className={cn(CELL_INPUT, 'w-36')}
          value={value.paidDate}
          onChange={(e) => set({ paidDate: e.target.value })}
          onKeyDown={onCellKeyDown}
        />
      </TableCell>

      <TableCell className="p-2">
        <Input
          aria-label="Ghi chú"
          placeholder="Ghi chú…"
          maxLength={255}
          disabled={saving}
          className={cn(CELL_INPUT, 'min-w-48')}
          value={value.note}
          onChange={(e) => set({ note: e.target.value })}
          onKeyDown={onCellKeyDown}
        />
      </TableCell>

      <TableCell className="p-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {dirty && !saving && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground cursor-pointer"
              title="Huỷ thay đổi dòng này (Esc)"
              onClick={() => discard(row.id)}
            >
              <Undo2 />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="cursor-pointer"
            disabled={!dirty || saving || dueInvalid || paidInvalid}
            onClick={() => void save()}
          >
            {saving && <Loader2 className="animate-spin" />}
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
