import { CheckCircle2, LogOut, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  attended: number;
  leave: number;
  notAttended: number;
  /** 'sm' — icon + số, dùng cho thẻ nhỏ. 'md' — icon + nhãn + số, dùng cho header trang. */
  size?: 'sm' | 'md';
  className?: string;
}

const STATS = [
  { key: 'attended', label: 'Đã điểm danh', icon: CheckCircle2, color: 'text-emerald-600' },
  { key: 'leave', label: 'Xin nghỉ', icon: LogOut, color: 'text-amber-600' },
  { key: 'notAttended', label: 'Chưa điểm danh', icon: XCircle, color: 'text-red-500' },
] as const;

export default function AttendanceStatsInline({
  attended,
  leave,
  notAttended,
  size = 'sm',
  className,
}: Props) {
  const values: Record<(typeof STATS)[number]['key'], number> = {
    attended,
    leave,
    notAttended,
  };
  const isCompact = size === 'sm';

  return (
    <div
      className={cn(
        'text-muted-foreground flex flex-wrap items-center',
        isCompact ? 'gap-3 text-xs' : 'gap-4 text-sm',
        className,
      )}
    >
      {STATS.map(({ key, label, icon: Icon, color }) => (
        <span
          key={key}
          className={cn('inline-flex items-center', isCompact ? 'gap-1' : 'gap-1.5')}
          title={isCompact ? label : undefined}
        >
          <Icon className={cn(isCompact ? 'size-3.5' : 'size-4', color)} />
          {isCompact ? (
            values[key]
          ) : (
            <>
              {label} <span className="text-foreground font-medium">{values[key]}</span>
            </>
          )}
        </span>
      ))}
    </div>
  );
}
