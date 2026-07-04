import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function CourseDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back button (← Danh sách khóa học) */}
      <Skeleton className="h-8 w-44" />

      {/* Course header: title + badge, subtitle line */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        {/* Mã khóa học: · category · X học sinh */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Tabs bar: Thông tin / Nội dung / Học sinh / Thống kê */}
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-md border p-1">
        {['Thông tin', 'Nội dung', 'Học sinh', 'Thống kê'].map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-sm" />
        ))}
      </div>

      {/* Tab content — info tab (mặc định): Card "Thông tin khóa học" */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-28" />
        </CardHeader>
        <CardContent className="space-y-6 pb-6">
          {/* Thumbnail */}
          <Skeleton className="h-56 w-full rounded-lg" />

          {/* dl grid: grid-cols-1 md:grid-cols-2 — 12 trường thông tin */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            ))}
          </div>

          {/* Long-text fields (mô tả, đối tượng, mục tiêu, giảng viên) */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-divider flex items-start gap-3 border-t pt-5">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
