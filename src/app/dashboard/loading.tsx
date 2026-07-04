import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome banner card (gradient) */}
      <Card className="from-primary to-primary/80 gap-2 border-0 bg-linear-to-br shadow-md">
        <CardContent className="flex flex-col gap-3 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-36 bg-white/20" />
            <Skeleton className="h-8 w-48 bg-white/20" />
            <Skeleton className="h-4 w-72 max-w-full bg-white/20" />
          </div>
          <Skeleton className="h-9 w-36 self-start bg-white/70 sm:self-center" />
        </CardContent>
      </Card>

      {/* Stats grid — 1 thẻ (Lớp đang học) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="gap-3">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-10" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="size-10 shrink-0 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* "Lớp học của tôi" section */}
      <div>
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-0">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                {/* Đã điểm danh / Xin nghỉ / Chưa điểm danh */}
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
