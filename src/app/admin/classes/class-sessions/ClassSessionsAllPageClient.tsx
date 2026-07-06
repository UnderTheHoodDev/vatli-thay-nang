'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { CalendarClock, Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PageHeader from '@/components/app/PageHeader';
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import AttendanceToggle from '@/components/features/class-sessions/AttendanceToggle';
import ClassSessionFormModal from '@/components/features/class-sessions/ClassSessionFormModal';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { CLASS_SESSION_STATUS_MAP, getEffectiveStatus } from '@/lib/class-sessions';
import type { ListMeta } from '@/types/auth';
import type { ClassSessionListRowWithClass } from '@/types/actions/class-management';
import type { ClassRow } from '@/types/class-management';

export interface UrlState {
  classCode: string;
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
}

interface Props {
  urlState: UrlState;
  rows: ClassSessionListRowWithClass[];
  meta: ListMeta;
  errors: string[];
  classes: ClassRow[];
}

function buildUrlParams(state: UrlState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.classCode) sp.set('classCode', state.classCode);
  if (state.startDate) sp.set('startDate', state.startDate);
  if (state.endDate) sp.set('endDate', state.endDate);
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== 20) sp.set('pageSize', String(state.pageSize));
  return sp;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SKELETON_COLUMNS = ['w-8', 'w-24', 'w-48', 'w-40', 'w-40', 'w-28', 'w-24', 'w-32'];

export default function ClassSessionsAllPageClient({
  urlState,
  rows,
  meta,
  errors,
  classes,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (errors.length > 0) {
      errors.forEach((e) => toast.error(e));
    }
  }, [errors]);

  const [searchCode, setSearchCode] = useState(urlState.classCode);
  const [searchStartDate, setSearchStartDate] = useState(urlState.startDate);
  const [searchEndDate, setSearchEndDate] = useState(urlState.endDate);

  const updateUrl = useCallback(
    (next: Partial<UrlState>) => {
      const params = buildUrlParams({ ...urlState, ...next });
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname, urlState],
  );

  const handleSearch = () => {
    updateUrl({
      classCode: searchCode,
      startDate: searchStartDate,
      endDate: searchEndDate,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setSearchCode('');
    setSearchStartDate('');
    setSearchEndDate('');
    updateUrl({ classCode: '', startDate: '', endDate: '', page: 1 });
  };

  const { page, pageSize } = urlState;
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader title="Danh sách buổi học" description="Tổng hợp tất cả buổi học trên mọi lớp." />

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Mã lớp</Label>
              <Select
                value={searchCode || ALL_VALUE}
                onValueChange={(v) => setSearchCode(v === ALL_VALUE ? '' : v)}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Tất cả lớp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      <span className="font-mono text-xs">{c.code}</span> — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search-start">Từ ngày</Label>
              <Input
                id="search-start"
                type="date"
                value={searchStartDate}
                onChange={(e) => setSearchStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search-end">Đến ngày</Label>
              <Input
                id="search-end"
                type="date"
                value={searchEndDate}
                onChange={(e) => setSearchEndDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:col-span-2 sm:flex-row md:col-span-3 lg:col-span-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="cursor-pointer"
              >
                <X /> Xoá bộ lọc
              </Button>
              <Button onClick={handleSearch} className="cursor-pointer">
                <Search /> Tìm kiếm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Kết quả</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {total === 0
                ? 'Không có buổi học nào'
                : `Hiển thị ${start}–${end} trên tổng ${total} buổi`}
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
            <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
              Tạo buổi học
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          {!isPending && rows.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Không có buổi học nào"
              description="Thử thay đổi bộ lọc để xem kết quả khác."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead className="w-32">Mã lớp</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="w-40">Bắt đầu</TableHead>
                  <TableHead className="w-40">Kết thúc</TableHead>
                  <TableHead className="w-32">Trạng thái</TableHead>
                  <TableHead className="w-24 text-center">Điểm danh</TableHead>
                  <TableHead className="w-48">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableSkeleton columnWidths={SKELETON_COLUMNS} />
                ) : (
                  rows.map((row) => {
                    const statusInfo =
                      CLASS_SESSION_STATUS_MAP[getEffectiveStatus(row.startTime, row.endTime)];
                    return (
                      <TableRow
                        key={row.id}
                        onClick={() =>
                          router.push(
                            `/admin/classes/${row.classId}/class-sessions/${row.id}?from=sessions-list`,
                          )
                        }
                        className="hover:bg-muted cursor-pointer transition-colors"
                      >
                        <TableCell className="text-muted-foreground">{row.id}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/admin/classes/${row.classId}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                              {row.classCode}
                            </code>
                          </Link>
                        </TableCell>
                        <TableCell className="text-foreground font-medium">{row.title}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(row.startTime)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(row.endTime)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {row.attendedCount ?? 0}/{row.totalStudents ?? 0}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <AttendanceToggle
                            classSessionId={row.id}
                            startTime={row.startTime}
                            endTime={row.endTime}
                            activeAttendanceSession={row.activeAttendanceSession ?? null}
                            onChanged={() => router.refresh()}
                          />
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
            <div className="text-muted-foreground text-sm">
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

      <ClassSessionFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        classes={classes}
      />
    </div>
  );
}
