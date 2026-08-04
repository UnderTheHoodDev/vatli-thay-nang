'use client';

import { use, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleActionErrors } from '@/lib/actions';
import { computeTuitionDiff, parseIntAmount, tuitionBaseDraft } from '@/lib/tuition';
import { useTuitionDrafts } from './TuitionDraftsProvider';
import { bulkUpdateTuitionAction } from '@/actions/v1/tuition/bulk-update-tuition';
import type { ListTuitionResponse } from '@/actions/v1/tuition/list-tuition';
import type { IBulkUpdateTuitionItem } from '@/types/actions/tuition';

interface Props {
  classId: number;
  promise: Promise<ListTuitionResponse>;
  onSaved: () => void;
}

/**
 * Chỉ được mount khi dirtyCount > 0 (xem TuitionPageClient) — muốn có nháp thì
 * bảng phải render trước, nên `promise` chắc đã resolve, `use()` ở đây không
 * treo trang chờ dữ liệu.
 */
export default function TuitionSaveAllButton({ classId, promise, onSaved }: Props) {
  const { drafts } = useTuitionDrafts();
  const { data: rows } = use(promise);
  const [saving, setSaving] = useState(false);

  async function saveAll() {
    if (saving || drafts.size === 0) return;

    const rowById = new Map(rows.map((r) => [r.id, r]));
    const items: IBulkUpdateTuitionItem[] = [];
    let invalidCount = 0;
    for (const [id, draft] of drafts) {
      const row = rowById.get(id);
      if (!row) continue;
      const due = parseIntAmount(draft.amountDue);
      const paid = parseIntAmount(draft.amountPaid);
      if (due === null || paid === null) {
        invalidCount++;
        continue;
      }
      const payload = computeTuitionDiff(tuitionBaseDraft(row), draft, due, paid);
      if (payload) items.push({ id, ...payload });
    }

    if (invalidCount > 0) {
      handleActionErrors([
        `${invalidCount} dòng có số tiền không hợp lệ — sửa lại trước khi lưu tất cả`,
      ]);
      return;
    }
    if (items.length === 0) {
      onSaved(); // toàn bộ nháp gõ rồi gõ lại như cũ — không có gì để lưu
      return;
    }

    setSaving(true);
    try {
      const res = await bulkUpdateTuitionAction(classId, { items });
      if (res.errors.length) {
        handleActionErrors(res.errors);
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      className="cursor-pointer"
      disabled={saving || drafts.size === 0}
      onClick={() => void saveAll()}
    >
      {saving ? <Loader2 className="animate-spin" /> : <Save />}
      {saving ? 'Đang lưu…' : `Lưu tất cả (${drafts.size})`}
    </Button>
  );
}
