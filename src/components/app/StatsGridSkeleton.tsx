import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  count: number;
  className?: string;
}

export default function StatsGridSkeleton({ count, className }: Props) {
  return (
    <div className={cn('grid gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="gap-3">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-10" />
              </div>
              <Skeleton className="size-10 shrink-0 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
