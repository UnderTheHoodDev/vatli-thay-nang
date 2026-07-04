import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// 11 cột khớp CoursesPageClient: ID ảnh tiêu-đề mã danh-mục giảng-viên trạng-thái chương bài-học học-sinh hành-động
const COLS = ['w-8', 'w-16', 'w-52', 'w-20', 'w-28', 'w-32', 'w-24', 'w-14', 'w-14', 'w-14', 'w-20'];

export default function CoursesLoading() {
  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats: grid-cols-2 lg:grid-cols-4 — 4 thẻ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

      {/* Filter card: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 — 4 ô + 1 hàng nút */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Tiêu đề, Mã, Danh mục, Trạng thái */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
            <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:col-span-2 sm:flex-row lg:col-span-4">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table card */}
      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {COLS.map((w, i) => (
                  <TableHead key={i}>
                    <Skeleton className={`h-4 ${w}`} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {COLS.map((w, j) => (
                    <TableCell key={j}>
                      <Skeleton className={`h-4 ${w}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
