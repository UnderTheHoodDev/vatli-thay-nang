'use client';

import { Suspense, use, useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Coins, HandCoins, Receipt, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import StatsCard from '@/components/app/StatsCard';
import StatsGridSkeleton from '@/components/app/StatsGridSkeleton';
import MonthPicker from '@/components/features/tuition/MonthPicker';
import RecomputeTuitionButton from '@/components/features/tuition/RecomputeTuitionButton';
import TuitionExportDialog from '@/components/features/tuition/TuitionExportDialog';
import TuitionImportDialog from '@/components/features/tuition/TuitionImportDialog';
import TuitionTable, { TuitionTableFallback } from '@/components/features/tuition/TuitionTable';
import TuitionDraftsProvider, {
  useTuitionDrafts,
} from '@/components/features/tuition/TuitionDraftsProvider';
import { formatAmountVnd } from '@/lib/format';
import type { ClassDetail } from '@/types/class-management';
import type { ListTuitionResponse } from '@/actions/v1/tuition/list-tuition';

export interface TuitionUrlState {
  year: number;
  month: number;
}

interface Props {
  classDetail: ClassDetail;
  urlState: TuitionUrlState;
  currentYear: number;
  tuitionPromise: Promise<ListTuitionResponse>;
}

const STATS_GRID = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';

/** year/month LUÔN có mặt: URL chia sẻ được và không đổi nghĩa khi sang tháng mới. */
function buildUrlParams(state: TuitionUrlState): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('year', String(state.year));
  sp.set('month', String(state.month));
  return sp;
}

function TuitionStatsSection({ promise }: { promise: Promise<ListTuitionResponse> }) {
  const { stats } = use(promise);
  return (
    <div className={`grid gap-3 ${STATS_GRID}`}>
      <StatsCard
        label="Tổng phải thu"
        value={formatAmountVnd(stats.totalDue)}
        icon={Receipt}
        tone="primary"
      />
      <StatsCard
        label="Tổng đã thu"
        value={formatAmountVnd(stats.totalPaid)}
        icon={HandCoins}
        tone="success"
      />
      <StatsCard
        label="Còn thiếu"
        value={formatAmountVnd(stats.totalRemaining)}
        icon={Coins}
        tone={stats.totalRemaining > 0 ? 'warning' : 'muted'}
      />
      <StatsCard
        label="Đóng thiếu"
        value={stats.partialCount}
        icon={Coins}
        tone={stats.partialCount > 0 ? 'warning' : 'muted'}
        hint="đã thu một phần"
      />
      <StatsCard
        label="Chưa đóng"
        value={stats.unpaidCount}
        icon={TriangleAlert}
        tone={stats.unpaidCount > 0 ? 'destructive' : 'muted'}
        hint={`${stats.paidCount}/${stats.studentCount} đã đóng đủ`}
      />
    </div>
  );
}

function TuitionResultSummary({ promise }: { promise: Promise<ListTuitionResponse> }) {
  const { data, stats } = use(promise);
  return (
    <p className="text-muted-foreground mt-1 text-sm">
      {data.length === 0
        ? 'Không có học sinh nào theo học trong tháng này'
        : `${data.length} học sinh`}
      {stats.nothingDueCount > 0 && ` · ${stats.nothingDueCount} học sinh không phải đóng`}
    </p>
  );
}

function TuitionTableSection({
  classId,
  promise,
  isPending,
  onRowSaved,
}: {
  classId: number;
  promise: Promise<ListTuitionResponse>;
  isPending: boolean;
  onRowSaved: (rowId: number) => void;
}) {
  const { data: rows, errors } = use(promise);
  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);
  return (
    <TuitionTable classId={classId} rows={rows} isPending={isPending} onRowSaved={onRowSaved} />
  );
}

/** Nội dung thật — nằm TRONG provider để đọc được dirtyCount. */
function TuitionPageBody({ classDetail, urlState, currentYear, tuitionPromise }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { dirtyCount, discard, discardAll } = useTuitionDrafts();
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  // Chặn đóng tab / F5 / gõ URL khi còn dòng chưa lưu. KHÔNG bắt được <Link>
  // trong sidebar — Next 16 chưa có hook chặn điều hướng nội bộ.
  useEffect(() => {
    if (dirtyCount === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirtyCount]);

  /** Mọi thao tác làm dữ liệu bảng đổi đều đi qua đây. */
  const guarded = useCallback(
    (run: () => void) => {
      if (dirtyCount > 0) {
        setPendingNav(() => run);
        return;
      }
      run();
    },
    [dirtyCount],
  );

  const goToMonth = useCallback(
    (year: number, month: number) => {
      guarded(() => {
        discardAll();
        startTransition(() => router.push(`${pathname}?${buildUrlParams({ year, month })}`));
      });
    },
    [guarded, discardAll, router, pathname, startTransition],
  );

  // Xoá nháp + refetch trong CÙNG một transition: React commit hai việc cùng lúc nên
  // ô không nháy về giá trị cũ trong lúc chờ RSC payload mới.
  const handleRowSaved = useCallback(
    (rowId: number) => {
      startTransition(() => {
        discard(rowId);
        router.refresh();
      });
    },
    [discard, router, startTransition],
  );

  const monthLabel = `Tháng ${urlState.month}/${urlState.year}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground w-fit cursor-pointer pl-1"
        >
          <Link href={`/admin/classes/${classDetail.id}`}>
            <ArrowLeft /> Chi tiết lớp
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="font-paytone text-foreground text-2xl tracking-tight">
            Học phí — {classDetail.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Mã lớp{' '}
            <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
              {classDetail.code}
            </code>
            <span className="mx-2">·</span>
            {monthLabel}
          </p>
        </div>
      </div>

      <Suspense fallback={<StatsGridSkeleton count={5} className={STATS_GRID} />}>
        <TuitionStatsSection promise={tuitionPromise} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5">
              <Label>Tháng</Label>
              <MonthPicker
                year={urlState.year}
                month={urlState.month}
                currentYear={currentYear}
                disabled={isPending}
                onChange={goToMonth}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TuitionExportDialog
                classId={classDetail.id}
                year={urlState.year}
                month={urlState.month}
              />
              <TuitionImportDialog
                classId={classDetail.id}
                year={urlState.year}
                month={urlState.month}
              />
              <RecomputeTuitionButton
                classId={classDetail.id}
                year={urlState.year}
                month={urlState.month}
                disabled={isPending}
                onRequest={(run) =>
                  guarded(() => {
                    discardAll();
                    run();
                  })
                }
              />
            </div>
          </div>
          {dirtyCount > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
              <TriangleAlert className="size-3.5" />
              {dirtyCount} dòng chưa lưu. Đổi tháng hoặc tính lại sẽ mất các thay đổi này.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="pb-4">
          <CardTitle>Bảng học phí {monthLabel}</CardTitle>
          <Suspense fallback={<Skeleton className="mt-1 h-4 w-40" />}>
            <TuitionResultSummary promise={tuitionPromise} />
          </Suspense>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          <Suspense fallback={<TuitionTableFallback />}>
            <TuitionTableSection
              classId={classDetail.id}
              promise={tuitionPromise}
              isPending={isPending}
              onRowSaved={handleRowSaved}
            />
          </Suspense>
        </CardContent>
      </Card>

      <AlertDialog open={pendingNav !== null} onOpenChange={(o) => !o && setPendingNav(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Còn {dirtyCount} dòng chưa lưu</AlertDialogTitle>
            <AlertDialogDescription>
              Tiếp tục sẽ bỏ toàn bộ thay đổi chưa lưu. Bấm Huỷ để quay lại và bấm Lưu ở từng dòng
              trước.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const run = pendingNav;
                setPendingNav(null);
                discardAll();
                run?.();
              }}
            >
              Bỏ thay đổi và tiếp tục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TuitionPageClient(props: Props) {
  return (
    <TuitionDraftsProvider>
      <TuitionPageBody {...props} />
    </TuitionDraftsProvider>
  );
}
