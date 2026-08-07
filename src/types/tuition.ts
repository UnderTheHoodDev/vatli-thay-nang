export type TuitionStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export const TUITION_STATUS_LABEL: Record<TuitionStatus, string> = {
  PAID: 'Đã đóng đủ',
  PARTIAL: 'Đóng thiếu',
  UNPAID: 'Chưa đóng',
};

export const TUITION_STATUS_VARIANT: Record<TuitionStatus, 'success' | 'warning' | 'destructive'> =
  {
    PAID: 'success',
    PARTIAL: 'warning',
    UNPAID: 'destructive',
  };
