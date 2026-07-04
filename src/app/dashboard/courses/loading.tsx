import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function CoursesLoading() {
  return (
    <div className="space-y-6">
      {/* PageHeader: "Khóa học" + description */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Course card grid — grid-cols-1 sm:grid-cols-2 md:grid-cols-3 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-full gap-0 overflow-hidden p-0">
            {/* Thumbnail: aspect-video */}
            <Skeleton className="aspect-video w-full rounded-none" />

            {/* CardHeader pt-4 pb-2: title (line-clamp-2) + code + category */}
            <CardHeader className="pt-4 pb-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="mt-1 h-5 w-3/4" />
              <div className="mt-1 flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </CardHeader>

            {/* CardContent: description (line-clamp-2) + price/action row */}
            <CardContent className="space-y-3 pb-5">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-9 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
