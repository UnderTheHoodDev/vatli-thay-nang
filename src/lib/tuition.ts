import { toDateInputValue } from '@/lib/format';
import type { TuitionStatus } from '@/types/tuition';
import type { TuitionDraft } from '@/components/features/tuition/TuitionDraftsProvider';
import type { IUpdateTuitionPayload, TuitionListRow } from '@/types/actions/tuition';

/**
 * Cùng công thức với BE (tuition.util.ts). Nhân bản ở FE để badge cập nhật ngay
 * khi admin đang gõ trong ô, trước khi bấm Lưu. Nếu BE đổi luật, sửa cả hai.
 */
export function deriveTuitionStatus(amountDue: number, amountPaid: number): TuitionStatus {
  if (amountPaid > 0 && amountPaid >= amountDue) return 'PAID';
  if (amountPaid > 0 && amountPaid < amountDue) return 'PARTIAL';
  return 'UNPAID';
}

/**
 * Chuỗi từ <input type="number"> → số nguyên VND không âm. null = không hợp lệ.
 * type="number" vẫn cho gõ '1e5', '1.5', '-3' nên phải chặn ở đây.
 */
export function parseIntAmount(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

/** Nháp khởi tạo từ giá trị server — dùng chung cho lưu từng dòng và lưu tất cả. */
export function tuitionBaseDraft(row: TuitionListRow): TuitionDraft {
  return {
    amountDue: String(row.amountDue),
    amountPaid: String(row.amountPaid),
    paidDate: toDateInputValue(row.paidDate),
    note: row.note ?? '',
  };
}

/**
 * Diff nháp so với giá trị gốc — chỉ trả field thực sự đổi (dùng chung cho lưu
 * từng dòng và lưu tất cả). Gửi thừa `amountDue` không đổi sẽ bật nhầm
 * isDueOverridden ở BE.
 *
 * Nhận `due`/`paid` đã parse từ ngoài (không tự parseIntAmount lại) — nơi gọi
 * luôn cần validate 2 số này TRƯỚC (để báo lỗi/bỏ qua dòng hỏng), nên bắt parse
 * lại trong này chỉ tốn công và làm "hỏng số" với "không đổi gì" gộp chung vào
 * cùng 1 kiểu trả về, khó phân biệt ở nơi gọi.
 */
export function computeTuitionDiff(
  base: TuitionDraft,
  draft: TuitionDraft,
  due: number,
  paid: number,
): IUpdateTuitionPayload | null {
  const payload: IUpdateTuitionPayload = {};
  if (draft.amountDue !== base.amountDue) payload.amountDue = due;
  if (draft.amountPaid !== base.amountPaid) payload.amountPaid = paid;
  if (draft.paidDate !== base.paidDate) payload.paidDate = draft.paidDate || null;
  if (draft.note !== base.note) payload.note = draft.note.trim() || null;
  return Object.keys(payload).length > 0 ? payload : null;
}
