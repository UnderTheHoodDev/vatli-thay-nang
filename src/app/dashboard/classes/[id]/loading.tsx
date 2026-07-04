import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ClassDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header: back link + name + code + badge, description, stats row */}
      <div className="flex flex-col gap-2">
        {/* Back link: ← Lớp học của tôi */}
        <Skeleton className="h-8 w-36" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        {/* description line */}
        <Skeleton className="h-4 w-72" />
        {/* Đã điểm danh / Xin nghỉ / Chưa điểm danh */}
        <div className="flex flex-wrap items-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-28" />
          ))}
        </div>
      </div>

      {/* Table card */}
      <Card className="gap-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {/* CalendarDays icon + "Danh sách buổi học" */}
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-50">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="min-w-37.5">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="min-w-37.5">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="w-32">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="w-36">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 20 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="size-9 rounded-md" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
