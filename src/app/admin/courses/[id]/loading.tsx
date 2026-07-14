import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function CourseDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      <div className="bg-muted/50 flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-md" />
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
