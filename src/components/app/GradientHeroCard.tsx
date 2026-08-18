import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
}

/** Card gradient tím→hồng dùng cho các hero card phía học sinh (dashboard, chi
 * tiết lớp học) — gộp lại để đổi màu/shadow chỉ cần sửa một chỗ. */
export default function GradientHeroCard({ children, className }: Props) {
  return (
    <Card
      className={cn(
        'from-primary via-primary to-pink-dark/90 text-primary-foreground relative gap-3 overflow-hidden border-0 bg-linear-to-br shadow-lg shadow-primary/25',
        className,
      )}
    >
      <div className="bg-gold/30 pointer-events-none absolute -top-16 -right-10 size-56 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-white/10 blur-3xl" />
      {children}
    </Card>
  );
}
