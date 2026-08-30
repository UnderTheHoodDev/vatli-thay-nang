import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  hint?: string;
  tone?: 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'muted';
  className?: string;
}

const TONE_BG: Record<NonNullable<Props['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  destructive: 'bg-red-100 text-red-700',
  info: 'bg-purple/10 text-purple',
  muted: 'bg-muted text-muted-foreground',
};

export default function StatsCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'primary',
  className,
}: Props) {
  return (
    <Card className={cn('gap-3', className)}>
      <CardContent className="py-4 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-foreground/60 text-[0.8rem] font-medium tracking-wide uppercase">
              {label}
            </p>
            {/* Không dùng `truncate`: số tiền lớn (vd "15.000.000 đ") bị cắt
                thành "15.000.000..." khi card hẹp — sai số liệu nhìn vào. Cho
                phép wrap 2 dòng thay vì cắt mất số. */}
            <p className="text-foreground text-2xl leading-tight font-semibold wrap-break-word">
              {value}
            </p>
            {hint && <p className="text-muted-foreground text-[0.8rem]">{hint}</p>}
          </div>
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              TONE_BG[tone],
            )}
          >
            <Icon className="size-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
