import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function LearnLoading() {
  return (
    <div className="space-y-4 pb-16 lg:pb-0">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="hidden h-8 w-28 lg:block" />
      </div>

      {/* Segmented control: nội dung khóa học ↔ bài kiểm tra */}
      <div className="bg-muted inline-flex gap-1 rounded-lg p-1">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-7 w-72 max-w-full" />
            <Skeleton className="h-4 w-56" />
          </div>

          <Skeleton className="aspect-video w-full rounded-lg" />

          <div className="flex items-stretch justify-between gap-2">
            <Skeleton className="h-14 w-[48%] rounded-md" />
            <Skeleton className="h-14 w-[48%] rounded-md" />
          </div>

          <Card className="mt-2">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-11/12" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="hidden lg:block">
          <div className="border-divider bg-background overflow-hidden rounded-lg border">
            <div className="border-divider bg-muted/40 space-y-1.5 border-b px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-4 px-4 py-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-4" style={{ width: `${70 - (i % 3) * 12}%` }} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
