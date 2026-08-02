import type { TuitionStatus } from '@/types/tuition';

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
