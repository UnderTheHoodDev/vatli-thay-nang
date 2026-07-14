'use client';

import { useCallback, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, CalendarDays, FileX2, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AttendanceStatsInline from '@/components/features/classes/AttendanceStatsInline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import { CLASS_SESSION_STATUS_MAP, getEffectiveStatus } from '@/lib/class-sessions';
import { formatDateTime } from '@/lib/format';
import { handleActionErrors } from '@/lib/actions';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { ListMeta } from '@/types/auth';
import type { ClassSessionListRow } from '@/types/actions/class-management';
import type { ClassDetail } from '@/types/class-management';

const SKELETON_COLUMNS = ['w-48', 'w-32', 'w-32', 'w-20', 'w-28'];

interface Props {
  classRow: ClassDetail;
  sessions: ClassSessionListRow[];
  meta: ListMeta;
  errors: string[];
  page: number;
  pageSize: number;
}

export default function StudentClassDetailClient({
  classRow,
  sessions,
  meta,
  errors,
  page,
  pageSize,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    handleActionErrors(errors);
  }, [errors]);

  const updateUrl = useCallback(
    (next: { page?: number; pageSize?: number }) => {
      const sp = new URLSearchParams();
      const nextPage = next.page ?? page;
      const nextPageSize = next.pageSize ?? pageSize;
      if (nextPage !== 1) sp.set('page', String(nextPage));
      if (nextPageSize !== 20) sp.set('pageSize', String(nextPageSize));
      const query = sp.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname, page, pageSize],
  );

  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground w-fit cursor-pointer pl-1"
        >
          <Link href="/dashboard">
            <ArrowLeft /> Lớp học của tôi
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-paytone text-foreground text-2xl tracking-tight">{classRow.name}</h1>
          <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
            {classRow.code}
          </code>
          <Badge variant={classRow.status === 'ACTIVE' ? 'success' : 'secondary'}>
            {classRow.status === 'ACTIVE' ? 'Đang học' : 'Đã đóng'}
          </Badge>
          {classRow.hasActiveAttendance && (
            <Badge variant="success" className="gap-1">
              <Radio className="size-3 animate-pulse" /> Đang mở điểm danh
            </Badge>
          )}
        </div>
        {classRow.description && (
          <p className="text-muted-foreground text-sm">{classRow.description}</p>
        )}
        <AttendanceStatsInline
          attended={classRow.attendedCount ?? 0}
          leave={classRow.leaveCount ?? 0}
          notAttended={classRow.notAttendedCount ?? 0}
          size="md"
        />
      </div>

      <Card className="gap-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5" /> Danh sách buổi học
            </CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {total === 0
                ? 'Chưa có buổi học nào'
                : `Hiển thị ${start}–${end} trên tổng ${total} buổi học`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => updateUrl({ pageSize: Number(v), page: 1 })}
            >
              <SelectTrigger className="w-24 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-6">
          {!isPending && sessions.length === 0 ? (
            <EmptyState
              icon={FileX2}
              title="Chưa có buổi học"
              description="Lớp này chưa có buổi học nào được lên lịch."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="min-w-50">Tiêu đề</TableHead>
                  <TableHead className="min-w-37.5">Bắt đầu</TableHead>
                  <TableHead className="min-w-37.5">Kết thúc</TableHead>
                  <TableHead className="w-32">Trạng thái</TableHead>
                  <TableHead className="w-36">Điểm danh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableSkeleton columnWidths={SKELETON_COLUMNS} />
                ) : (
                  sessions.map((s) => {
                    const statusInfo =
                      CLASS_SESSION_STATUS_MAP[getEffectiveStatus(s.startTime, s.endTime)];
                    return (
                      <TableRow
                        key={s.id}
                        onClick={() =>
                          router.push(`/dashboard/classes/${classRow.id}/class-sessions/${s.id}`)
                        }
                        className="hover:bg-muted cursor-pointer transition-colors"
                      >
                        <TableCell className="text-foreground font-medium">{s.title}</TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDateTime(s.startTime)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDateTime(s.endTime)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {s.hasActiveAttendance && (
                              <Radio className="text-primary size-3.5 shrink-0 animate-pulse" />
                            )}
                            {s.myStatus === 'ATTENDED' ? (
                              <Badge variant="success">Đã điểm danh</Badge>
                            ) : s.myStatus === 'ON_LEAVE' ? (
                              <Badge variant="warning">Xin nghỉ</Badge>
                            ) : s.myStatus === 'NOT_ATTENDED' ? (
                              <Badge variant="destructive">Chưa điểm danh</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
            <div className="text-muted-foreground text-sm whitespace-nowrap">
              Trang {page} / {totalPages}
            </div>
            <DataPagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => updateUrl({ page: p })}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
