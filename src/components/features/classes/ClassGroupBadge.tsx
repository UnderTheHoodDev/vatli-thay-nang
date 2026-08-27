import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CLASS_GROUP_COLOR_META } from '@/types/class-management';
import type { ClassGroup } from '@/types/class-management';

interface Props {
  group: ClassGroup | null;
  className?: string;
}

export default function ClassGroupBadge({ group, className }: Props) {
  if (!group) {
    return (
      <Badge
        variant="outline"
        className={cn('text-muted-foreground border-dashed font-medium italic', className)}
      >
        Chưa phân nhóm
      </Badge>
    );
  }

  const meta = CLASS_GROUP_COLOR_META[group.color];
  return (
    <Badge
      variant="outline"
      className={className}
      style={{ backgroundColor: meta.bg, color: meta.text, borderColor: meta.border }}
    >
      {group.name}
    </Badge>
  );
}
