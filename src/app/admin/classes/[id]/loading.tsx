import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ClassDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back button: ← Danh sách lớp học */}
      <Skeleton className="h-8 w-40" />

      {/* Class header: name + badge, subtitle line */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        {/* Mã lớp: · X học sinh */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Tabs: Thông tin / Học sinh / Buổi học */}
      <div className="flex gap-1 rounded-md border p-1">
        {['Thông tin', 'Học sinh', 'Buổi học'].map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-sm" />
        ))}
      </div>

      {/* Tab content — info tab (mặc định): Card ClassInfoTab */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-6 pb-6">
          {/* dl grid: grid-cols-1 md:grid-cols-2 — 5 trường */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
          {/* Mô tả */}
          <div className="border-divider flex items-start gap-3 border-t pt-5">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
