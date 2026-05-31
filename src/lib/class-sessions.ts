import type { ClassSessionStatus } from '@/types/class-management';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

export const CLASS_SESSION_STATUS_MAP: Record<
  ClassSessionStatus,
  { label: string; variant: BadgeVariant }
> = {
  SCHEDULED: { label: 'Đã lên lịch', variant: 'outline' },
  IN_PROGRESS: { label: 'Đang diễn ra', variant: 'success' },
  COMPLETED: { label: 'Hoàn thành', variant: 'secondary' },
  CANCELLED: { label: 'Đã huỷ', variant: 'destructive' },
};

/**
 * Derives the display status from stored DB status + actual times.
 * CANCELLED and COMPLETED are terminal — always respected.
 * SCHEDULED/IN_PROGRESS are overridden when the clock has moved past them.
 */
export function getEffectiveStatus(
  status: ClassSessionStatus,
  startTime: string,
  endTime: string,
): ClassSessionStatus {
  if (status === 'CANCELLED' || status === 'COMPLETED') return status;
  const now = new Date();
  if (now > new Date(endTime)) return 'COMPLETED';
  if (now >= new Date(startTime)) return 'IN_PROGRESS';
  return 'SCHEDULED';
}
