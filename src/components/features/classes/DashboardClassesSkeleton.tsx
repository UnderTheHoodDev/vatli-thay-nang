import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatsGridSkeleton from '@/components/app/StatsGridSkeleton';

export default function DashboardClassesSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <StatsGridSkeleton count={1} className="grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" />
      <div>
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-0">
              <CardHeader className="pb-2">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 space-y-1.5">
                      <Skeleton className="h-4 w-32 max-w-full" />
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                {/* 1 khối duy nhất khớp cây DOM với <p> thật (line-clamp-2, cao 40px). */}
                <Skeleton className="h-10 w-full" />
                <div className="flex items-center gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-3 w-10" />
                  ))}
                </div>
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
