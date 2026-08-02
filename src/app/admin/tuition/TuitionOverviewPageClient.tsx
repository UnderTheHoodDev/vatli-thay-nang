'use client';

import { Suspense, use, useCallback, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { HandCoins, School, Wallet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PageHeader from '@/components/app/PageHeader';
import StatsCard from '@/components/app/StatsCard';
import StatsGridSkeleton from '@/components/app/StatsGridSkeleton';
import TablePagerFooter from '@/components/app/TablePagerFooter';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import MonthPicker from '@/components/features/tuition/MonthPicker';
import TuitionClassFilterSelect from '@/components/features/tuition/TuitionClassFilterSelect';
import { formatAmountVnd } from '@/lib/format';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { ClassRow } from '@/types/class-management';
import type { ListTuitionOverviewResponse } from '@/actions/v1/tuition/list-tuition-overview';

export interface TuitionOverviewUrlState {
  year: number;
  month: number;
  classId?: number;
  page: number;
  pageSize: number;
}

interface Props {
  classes: ClassRow[];
  urlState: TuitionOverviewUrlState;
  currentYear: number;
  overviewPromise: Promise<ListTuitionOverviewResponse>;
}

const STATS_GRID = 'grid-cols-1 sm:grid-cols-2';
const SKELETON_COLUMNS = ['w-8', 'w-24', 'w-48', 'w-28', 'w-32', 'w-32', 'w-32'];

function buildUrlParams(state: TuitionOverviewUrlState): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('year', String(state.year));
  sp.set('month', String(state.month));
  if (state.classId) sp.set('classId', String(state.classId));
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== 20) sp.set('pageSize', String(state.pageSize));
  return sp;
}

function OverviewStatsSection({ promise }: { promise: Promise<ListTuitionOverviewResponse> }) {
  const { stats } = use(promise);
  return (
    <div className={`grid gap-3 ${STATS_GRID}`}>
      <StatsCard
        label="Tổng đã nhận tháng này"
        value={formatAmountVnd(stats.receivedThisMonth)}
        icon={Wallet}
        tone="primary"
      />
      <StatsCard
        label="Tổng thu lũy kế đến hiện tại"
        value={formatAmountVnd(stats.receivedToDate)}
        icon={HandCoins}
        tone="success"
      />
    </div>
  );
}

function OverviewResultSummary({
  promise,
  page,
  pageSize,
}: {
  promise: Promise<ListTuitionOverviewResponse>;
  page: number;
  pageSize: number;
}) {
  const { meta } = use(promise);
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <p className="text-muted-foreground mt-1 text-sm">
      {total === 0 ? 'Không có lớp học nào' : `Hiển thị ${start}–${end} trên tổng ${total} lớp`}
    </p>
  );
}

function OverviewTableHead() {
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableHead className="w-14">STT</TableHead>
        <TableHead>Mã lớp</TableHead>
        <TableHead>Tên lớp</TableHead>
        <TableHead className="text-center">Số học sinh</TableHead>
        <TableHead className="text-center">Số HS đã đóng xong</TableHead>
        <TableHead>Học phí yêu cầu</TableHead>
        <TableHead>Học phí thu được</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function OverviewTableSection({ promise }: { promise: Promise<ListTuitionOverviewResponse> }) {
  const { data, meta, errors } = use(promise);
  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={School}
        title="Không có lớp học nào"
        description="Tạo lớp học trước ở trang Lớp học để bắt đầu quản lý học phí."
      />
    );
  }

  const startIndex = (meta.page - 1) * meta.pageSize;
  return (
    <Table>
      <OverviewTableHead />
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={row.classId} className="hover:bg-muted">
            <TableCell className="text-muted-foreground">{startIndex + idx + 1}</TableCell>
            <TableCell>
              <Link
                href={`/admin/tuition/${row.classId}`}
                className="text-purple font-mono text-xs hover:underline"
              >
                {row.code}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/admin/tuition/${row.classId}`} className="hover:underline">
                {row.name}
              </Link>
            </TableCell>
            <TableCell className="text-center font-medium">{row.studentCount}</TableCell>
            <TableCell className="text-center font-medium">{row.paidStudentCount}</TableCell>
            <TableCell>{formatAmountVnd(row.amountDueTotal)}</TableCell>
            <TableCell>{formatAmountVnd(row.amountPaidTotal)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OverviewTableFallback() {
  return (
    <Table>
      <OverviewTableHead />
      <TableBody>
        <TableSkeleton columnWidths={SKELETON_COLUMNS} />
      </TableBody>
    </Table>
  );
}

function OverviewPaginationSection({
  promise,
  onPageChange,
}: {
  promise: Promise<ListTuitionOverviewResponse>;
  onPageChange: (page: number) => void;
}) {
  const { meta } = use(promise);
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.pageSize));
  return <TablePagerFooter page={meta.page} totalPages={totalPages} onPageChange={onPageChange} />;
}

export default function TuitionOverviewPageClient({
  classes,
  urlState,
  currentYear,
  overviewPromise,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (next: Partial<TuitionOverviewUrlState>) => {
      const merged = { ...urlState, ...next };
      const query = buildUrlParams(merged).toString();
      startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
    },
    [router, pathname, urlState, startTransition],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Học phí"
        description="Tổng quan tình hình thu học phí của tất cả các lớp."
      />

      <Suspense fallback={<StatsGridSkeleton count={2} className={STATS_GRID} />}>
        <OverviewStatsSection promise={overviewPromise} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="space-y-1.5">
                <Label>Lớp</Label>
                <TuitionClassFilterSelect
                  classes={classes}
                  value={urlState.classId}
                  disabled={isPending}
                  onChange={(classId) => updateUrl({ classId, page: 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tháng</Label>
                <MonthPicker
                  year={urlState.year}
                  month={urlState.month}
                  currentYear={currentYear}
                  disabled={isPending}
                  onChange={(year, month) => updateUrl({ year, month, page: 1 })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Danh sách các lớp</CardTitle>
            <Suspense fallback={<Skeleton className="mt-1 h-4 w-56" />}>
              <OverviewResultSummary
                promise={overviewPromise}
                page={urlState.page}
                pageSize={urlState.pageSize}
              />
            </Suspense>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Hiển thị</span>
            <Select
              value={String(urlState.pageSize)}
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
        <CardContent className="px-3 pb-0">
          <Suspense fallback={<OverviewTableFallback />}>
            <OverviewTableSection promise={overviewPromise} />
          </Suspense>
        </CardContent>
        <Suspense fallback={null}>
          <OverviewPaginationSection
            promise={overviewPromise}
            onPageChange={(p) => updateUrl({ page: p })}
          />
        </Suspense>
      </Card>
    </div>
  );
}
