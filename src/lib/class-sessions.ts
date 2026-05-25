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
