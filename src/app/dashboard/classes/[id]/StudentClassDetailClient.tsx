'use client';

import { Suspense, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, FileX2, GraduationCap, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GradientHeroCard from '@/components/app/GradientHeroCard';
import AttendanceSummaryCardSkeleton from '@/components/features/classes/AttendanceSummaryCardSkeleton';
import MyAttendanceSummaryCard from '@/components/features/classes/MyAttendanceSummaryCard';
import SessionsCardSkeleton from '@/components/features/classes/SessionsCardSkeleton';
import TuitionReminderBanner from '@/components/features/classes/TuitionReminderBanner';
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
import { CLASS_SESSION_STATUS_MAP, getEffectiveStatus } from '@/lib/class-sessions';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useResolved } from '@/lib/actions';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { GetMyAttendanceSummaryResponse } from '@/actions/v1/attendance/get-my-attendance-summary';
import type { ListClassSessionsResponse } from '@/actions/v1/class-sessions/list-class-sessions';
import type { ClassDetail } from '@/types/class-management';

interface Props {
  classRow: ClassDetail;
  sessionsPromise: Promise<ListClassSessionsResponse>;
  attendanceSummaryPromise: Promise<GetMyAttendanceSummaryResponse>;
  page: number;
  pageSize: number;
  tuitionReminder: { year: number; month: number } | null;
}

function AttendanceSummarySection({
  promise,
}: {
  promise: Promise<GetMyAttendanceSummaryResponse>;
}) {
  const { data } = useResolved(promise);
  if (!data) return null;
  return <MyAttendanceSummaryCard stats={data} />;
}

interface SessionsCardSectionProps {
  classId: number;
  promise: Promise<ListClassSessionsResponse>;
  page: number;
  pageSize: number;
  isPending: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function SessionsCardSection({
  classId,
  promise,
  page,
  pageSize,
  isPending,
  onPageChange,
  onPageSizeChange,
}: SessionsCardSectionProps) {
  const router = useRouter();
  const { data: sessions, meta } = useResolved(promise);

  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <CalendarDays className="size-4.5" />
            </span>
            Danh sách buổi học
          </CardTitle>
          <p className="text-muted-foreground mt-1 ml-11.5 text-sm">
            {total === 0
              ? 'Chưa có buổi học nào'
              : `Hiển thị ${start}–${end} trên tổng ${total} buổi học`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Hiển thị</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
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
      <CardContent className={cn('px-3 pb-6 transition-opacity', isPending && 'opacity-60')}>
        {sessions.length === 0 ? (
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
              {sessions.map((s) => {
                const statusInfo =
                  CLASS_SESSION_STATUS_MAP[getEffectiveStatus(s.startTime, s.endTime)];
                return (
                  <TableRow
                    key={s.id}
                    onClick={() =>
                      router.push(`/dashboard/classes/${classId}/class-sessions/${s.id}`)
                    }
                    className="hover:bg-primary/5 even:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <TableCell className="text-foreground font-medium">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                          <CalendarDays className="size-4" />
                        </span>
                        {s.title}
                      </div>
                    </TableCell>
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
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {totalPages > 1 && (
        <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
          <div className="text-muted-foreground text-sm whitespace-nowrap">
            Trang {page} / {totalPages}
          </div>
          <DataPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </Card>
  );
}

export default function StudentClassDetailClient({
  classRow,
  sessionsPromise,
  attendanceSummaryPromise,
  page,
  pageSize,
  tuitionReminder,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="space-y-4 sm:space-y-6">
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

      <GradientHeroCard>
        <CardContent className="relative space-y-3 py-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <GraduationCap className="size-5.5" />
            </span>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="font-paytone text-2xl tracking-tight">{classRow.name}</h1>
              <code className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-xs leading-none">
                {classRow.code}
              </code>
              <Badge className="border-0 bg-white/20 text-white">
                {classRow.status === 'ACTIVE' ? 'Đang học' : 'Đã đóng'}
              </Badge>
              {classRow.hasActiveAttendance && (
                <Badge className="gap-1 border-0 bg-white text-emerald-700">
                  <Radio className="size-3 animate-pulse" /> Đang mở điểm danh
                </Badge>
              )}
            </div>
          </div>
          {classRow.description && (
            <p className="max-w-2xl text-sm text-white/85">{classRow.description}</p>
          )}
        </CardContent>
      </GradientHeroCard>

      {classRow.activeAttendanceSessionId != null && (
        <Link
          href={`/dashboard/classes/${classRow.id}/class-sessions/${classRow.activeAttendanceSessionId}`}
          className="border-primary/30 from-primary/10 via-pink/5 hover:shadow-primary/10 flex items-center justify-between gap-3 rounded-lg border-l-4 bg-linear-to-r to-transparent p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="flex items-center gap-2">
            <Radio className="text-primary size-5 animate-pulse" />
            <span className="text-foreground font-medium">Lớp đang mở điểm danh</span>
          </span>
          <span className="from-primary to-pink-dark text-primary-foreground inline-flex items-center gap-1.5 rounded-md bg-linear-to-r px-4 py-2 text-sm font-medium shadow-sm">
            Điểm danh ngay <ArrowRight className="size-4" />
          </span>
        </Link>
      )}

      {tuitionReminder && (
        <TuitionReminderBanner
          month={tuitionReminder.month}
          year={tuitionReminder.year}
          classNames={[classRow.name]}
        />
      )}

      <Suspense fallback={<AttendanceSummaryCardSkeleton />}>
        <AttendanceSummarySection promise={attendanceSummaryPromise} />
      </Suspense>

      <Suspense fallback={<SessionsCardSkeleton />}>
        <SessionsCardSection
          classId={classRow.id}
          promise={sessionsPromise}
          page={page}
          pageSize={pageSize}
          isPending={isPending}
          onPageChange={(p) => updateUrl({ page: p })}
          onPageSizeChange={(s) => updateUrl({ pageSize: s, page: 1 })}
        />
      </Suspense>
    </div>
  );
}
