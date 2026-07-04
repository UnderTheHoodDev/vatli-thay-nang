import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function LearnLoading() {
  return (
    <div className="space-y-4">
      {/* Top row: ← Danh sách khóa học + mobile "Nội dung" button */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-24 md:hidden" />
      </div>

      {/* Grid: 1 col mobile / [1fr 360px] md+ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_360px]">
        {/* LEFT — content area */}
        <div className="min-w-0 space-y-5">
          {/* Course title + item breadcrumb */}
          <div className="space-y-1">
            <Skeleton className="h-7 w-3/4 md:h-8" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Content player area (video ratio) */}
          <Skeleton className="aspect-video w-full rounded-lg" />

          {/* Prev / Next nav */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>

          {/* CourseOverview Tabs */}
          <div className="space-y-4 pt-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="space-y-6 pb-6">
                {/* dl grid: grid-cols-1 sm:grid-cols-2 */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="size-4 shrink-0 rounded" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
                {/* Description */}
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-5/6" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
                {/* Đối tượng học viên / Mục tiêu đạt được / Giới thiệu giảng viên */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3.5 w-2/3" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT — sidebar (desktop only) */}
        <aside className="hidden md:sticky md:top-19 md:block md:h-[calc(100svh-92px)] md:overflow-hidden">
          <Card className="flex h-full flex-col overflow-hidden rounded-xl">
            <CardHeader className="border-b pb-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1 h-3.5 w-28" />
            </CardHeader>
            <CardContent className="flex-1 space-y-0 overflow-hidden p-0">
              {/* Chương — tất cả mặc định mở, có bài học + mục con thụt lề pl-9 */}
              {Array.from({ length: 3 }).map((_, ci) => (
                <div key={ci} className="border-divider border-b">
                  <div className="flex items-center gap-2 px-4 py-2.5">
                    <Skeleton className="size-4 shrink-0 rounded" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  {Array.from({ length: 2 }).map((_, li) => (
                    <div key={li}>
                      <div className="px-4 py-1.5">
                        <Skeleton className="h-3.5 w-32" />
                      </div>
                      {Array.from({ length: 2 }).map((_, ii) => (
                        <div key={ii} className="flex items-center gap-2 py-2 pr-3 pl-9">
                          <Skeleton className="size-3.5 shrink-0 rounded" />
                          <Skeleton className="h-3.5 w-36" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
