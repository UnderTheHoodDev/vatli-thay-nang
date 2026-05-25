import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  hint?: string;
  tone?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
  className?: string;
}

const TONE_BG: Record<NonNullable<Props['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  destructive: 'bg-red-100 text-red-700',
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
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {label}
            </p>
            <p className="text-foreground truncate text-2xl font-semibold">{value}</p>
            {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
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
