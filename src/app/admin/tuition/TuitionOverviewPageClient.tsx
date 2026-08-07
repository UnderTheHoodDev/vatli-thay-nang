'use client';

import { Suspense, use, useCallback, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, HandCoins, PiggyBank, School, TrendingUp, Wallet } from 'lucide-react';
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
import TuitionClassExcelCard from '@/components/features/tuition/TuitionClassExcelCard';
import TuitionClassFilterSelect from '@/components/features/tuition/TuitionClassFilterSelect';
import TuitionMonthRangeFilter from '@/components/features/tuition/TuitionMonthRangeFilter';
import TuitionRevenueTrendChart from '@/components/features/tuition/TuitionRevenueTrendChart';
import TuitionStatusTrendChart from '@/components/features/tuition/TuitionStatusTrendChart';
import { formatAmountVnd } from '@/lib/format';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { ListClassesResponse } from '@/actions/v1/classes/list-classes';
import type { ListTuitionOverviewResponse } from '@/actions/v1/tuition/list-tuition-overview';
import type { ListTuitionOverviewChartResponse } from '@/actions/v1/tuition/list-tuition-overview-chart';

export interface TuitionOverviewUrlState {
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  /** Tháng của bảng "Danh sách các lớp" — độc lập với khoảng fromYear/toYear của chart. */
  listYear: number;
  listMonth: number;
  /** Lớp lọc cho chart/stats phía trên — đặt tên đối xứng với listClassId để
   * không lẫn 2 field, dù cả hai đều optional number nên TypeScript không tự
   * bắt được nếu gõ nhầm field này chỗ kia. */
  chartClassId?: number;
  /** Lớp lọc riêng của bảng "Danh sách các lớp" — cũng là lớp dùng để xuất/nhập Excel. */
  listClassId?: number;
  page: number;
  pageSize: number;
}

interface Props {
  classesPromise: Promise<ListClassesResponse>;
  urlState: TuitionOverviewUrlState;
  currentYear: number;
  chartPromise: Promise<ListTuitionOverviewChartResponse>;
  overviewPromise: Promise<ListTuitionOverviewResponse>;
}

const CHART_STATS_GRID = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
const SKELETON_COLUMNS = ['w-8', 'w-24', 'w-48', 'w-28', 'w-32', 'w-32', 'w-32'];

function buildUrlParams(state: TuitionOverviewUrlState): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('fromYear', String(state.fromYear));
  sp.set('fromMonth', String(state.fromMonth));
  sp.set('toYear', String(state.toYear));
  sp.set('toMonth', String(state.toMonth));
  sp.set('listYear', String(state.listYear));
  sp.set('listMonth', String(state.listMonth));
  if (state.chartClassId) sp.set('chartClassId', String(state.chartClassId));
  if (state.listClassId) sp.set('listClassId', String(state.listClassId));
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== 20) sp.set('pageSize', String(state.pageSize));
  return sp;
}

function ChartStatsSection({ promise }: { promise: Promise<ListTuitionOverviewChartResponse> }) {
  const { stats } = use(promise);
  return (
    <div className={`grid gap-3 ${CHART_STATS_GRID}`}>
      <StatsCard
        label="Tổng phải thu (kỳ)"
        value={formatAmountVnd(stats.totalDue)}
        icon={Wallet}
        tone="primary"
      />
      <StatsCard
        label="Tổng đã thu (kỳ)"
        value={formatAmountVnd(stats.totalPaid)}
        icon={HandCoins}
        tone="success"
      />
      <StatsCard
        label="Còn thiếu (kỳ)"
        value={formatAmountVnd(stats.totalRemaining)}
        icon={PiggyBank}
        tone={stats.totalRemaining > 0 ? 'warning' : 'muted'}
      />
      <StatsCard
        label="Tỷ lệ thu"
        value={`${stats.collectionRate}%`}
        icon={TrendingUp}
        tone={stats.collectionRate >= 80 ? 'success' : 'info'}
        hint="đã thu / phải thu cả kỳ"
      />
    </div>
  );
}

function RevenueChartSection({ promise }: { promise: Promise<ListTuitionOverviewChartResponse> }) {
  const { data, errors } = use(promise);
  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);
  return <TuitionRevenueTrendChart data={data} />;
}

function StatusChartSection({ promise }: { promise: Promise<ListTuitionOverviewChartResponse> }) {
  const { data } = use(promise);
  return <TuitionStatusTrendChart data={data} />;
}

function ChartFallback() {
  return <Skeleton className="h-[300px] w-full" />;
}

function ClassFilterSection({
  classesPromise,
  value,
  disabled,
  onChange,
}: {
  classesPromise: Promise<ListClassesResponse>;
  value?: number;
  disabled: boolean;
  onChange: (classId?: number) => void;
}) {
  const { data: classes } = use(classesPromise);
  return (
    <TuitionClassFilterSelect
      classes={classes}
      value={value}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

function ClassFilterFallback() {
  return <Skeleton className="h-9 w-full sm:w-72" />;
}

function ExcelCardSection({
  classesPromise,
  classId,
  year,
  month,
}: {
  classesPromise: Promise<ListClassesResponse>;
  classId?: number;
  year: number;
  month: number;
}) {
  const { data: classes } = use(classesPromise);
  const selectedClass = classes.find((c) => c.id === classId);
  return (
    <TuitionClassExcelCard
      classId={classId}
      selectedClass={selectedClass}
      year={year}
      month={month}
    />
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
  classesPromise,
  urlState,
  currentYear,
  chartPromise,
  overviewPromise,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const updateUrl = useCallback(
    (next: Partial<TuitionOverviewUrlState>) => {
      const merged = { ...urlState, ...next };
      const query = buildUrlParams(merged).toString();
      // scroll: false — mặc định router.push cuộn lên đầu trang, rất khó chịu khi
      // đổi bộ lọc/tháng ở các khối nằm phía dưới (ví dụ MonthPicker của bảng).
      startTransition(() =>
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }),
      );
    },
    [router, pathname, urlState, startTransition],
  );

  const monthLabel = `${urlState.fromMonth}/${urlState.fromYear} – ${urlState.toMonth}/${urlState.toYear}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Học phí"
        description="Tổng quan tình hình thu học phí của tất cả các lớp."
      />

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <Label>Lớp</Label>
              <Suspense fallback={<ClassFilterFallback />}>
                <ClassFilterSection
                  classesPromise={classesPromise}
                  value={urlState.chartClassId}
                  disabled={isPending}
                  onChange={(chartClassId) => updateUrl({ chartClassId, page: 1 })}
                />
              </Suspense>
            </div>
            <TuitionMonthRangeFilter
              from={{ year: urlState.fromYear, month: urlState.fromMonth }}
              to={{ year: urlState.toYear, month: urlState.toMonth }}
              currentYear={currentYear}
              disabled={isPending}
              onChange={(from, to) =>
                updateUrl({
                  fromYear: from.year,
                  fromMonth: from.month,
                  toYear: to.year,
                  toMonth: to.month,
                  page: 1,
                })
              }
            />
          </div>
        </CardContent>

        <CardContent className="border-divider border-t pt-6 pb-6">
          <Suspense fallback={<StatsGridSkeleton count={4} className={CHART_STATS_GRID} />}>
            <ChartStatsSection promise={chartPromise} />
          </Suspense>
        </CardContent>

        <CardContent className="border-divider border-t pt-6 pb-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-foreground text-base font-semibold tracking-tight">
                Xu hướng thu học phí
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">{monthLabel}</p>
              <div className="mt-4">
                <Suspense fallback={<ChartFallback />}>
                  <RevenueChartSection promise={chartPromise} />
                </Suspense>
              </div>
            </div>
            <div>
              <h3 className="text-foreground text-base font-semibold tracking-tight">
                Xu hướng đóng học phí của học sinh
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">{monthLabel}</p>
              <div className="mt-4">
                <Suspense fallback={<ChartFallback />}>
                  <StatusChartSection promise={chartPromise} />
                </Suspense>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-4 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-muted-foreground size-4" />
              Danh sách các lớp
            </CardTitle>
            <Suspense fallback={<Skeleton className="mt-1 h-4 w-56" />}>
              <OverviewResultSummary
                promise={overviewPromise}
                page={urlState.page}
                pageSize={urlState.pageSize}
              />
            </Suspense>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label>Lớp</Label>
              <Suspense fallback={<ClassFilterFallback />}>
                <ClassFilterSection
                  classesPromise={classesPromise}
                  value={urlState.listClassId}
                  disabled={isPending}
                  onChange={(listClassId) => updateUrl({ listClassId, page: 1 })}
                />
              </Suspense>
            </div>
            <div className="space-y-2">
              <Label>Tháng</Label>
              <MonthPicker
                year={urlState.listYear}
                month={urlState.listMonth}
                currentYear={currentYear}
                disabled={isPending}
                onChange={(listYear, listMonth) => updateUrl({ listYear, listMonth, page: 1 })}
              />
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
          </div>
        </CardHeader>
        <CardContent className="border-divider border-t px-6 py-4">
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <ExcelCardSection
              classesPromise={classesPromise}
              classId={urlState.listClassId}
              year={urlState.listYear}
              month={urlState.listMonth}
            />
          </Suspense>
        </CardContent>
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
