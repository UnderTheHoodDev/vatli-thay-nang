'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Archive, BookOpen, CheckCircle2, FileEdit, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import PageHeader from '@/components/app/PageHeader';
import StatsCard from '@/components/app/StatsCard';
import StatsGridSkeleton from '@/components/app/StatsGridSkeleton';
import TablePagerFooter from '@/components/app/TablePagerFooter';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import ColumnFilterHead, {
  type ColumnFilterOption,
} from '@/components/app/table-filters/ColumnFilterHead';
import FilterChips, { type FilterChip } from '@/components/app/table-filters/FilterChips';
import TableSearchInput from '@/components/app/table-filters/TableSearchInput';
import { useTableFilters } from '@/components/app/table-filters/useTableFilters';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { handleActionResult } from '@/lib/actions';
import { deleteCourseAction } from '@/actions/v1/courses/delete-course';
import CourseFormModal from '@/components/features/courses/CourseFormModal';
import type { CourseRow } from '@/types/course-management';
import { COURSE_STATUS_OPTIONS } from '@/types/course-management';
import CourseStatusBadge from '@/components/features/courses/CourseStatusBadge';
import type { ListCoursesResponse } from '@/actions/v1/courses/list-courses';
import ScheduleSettingsCard from '@/components/features/schedule-settings/ScheduleSettingsCard';
import type { IScheduleSettings } from '@/types/actions/schedule-settings';

export interface UrlState {
  /** Tìm gộp: tiêu đề, mã khóa học. */
  q: string;
  status: string;
  instructorId: string;
  page: number;
  pageSize: number;
  [key: string]: string | number;
}

interface Props {
  urlState: UrlState;
  coursesPromise: Promise<ListCoursesResponse>;
  scheduleSettings: IScheduleSettings | null;
  instructorOptions: ColumnFilterOption[];
}

const DEFAULTS: UrlState = {
  q: '',
  status: ALL_VALUE,
  instructorId: ALL_VALUE,
  page: 1,
  pageSize: 20,
};

/** Lọc gắn thẳng vào header cột (giảng viên / trạng thái). */
interface CoursesHeaderFilters {
  status: HeaderFilter;
  instructorId: HeaderFilter;
}

interface HeaderFilter {
  value: string;
  options: ColumnFilterOption[];
  onChange: (value: string) => void;
}

const SKELETON_COLUMNS = [
  'w-8',
  'w-16',
  'w-52',
  'w-20',
  'w-28',
  'w-32',
  'w-24',
  'w-16',
  'w-14',
  'w-20',
];
const STATS_GRID = 'grid-cols-2 lg:grid-cols-4';

function CoursesStatsSection({ promise }: { promise: Promise<ListCoursesResponse> }) {
  const { stats } = use(promise);
  return (
    <div className={cn('grid gap-3', STATS_GRID)}>
      <StatsCard label="Tổng khóa học" value={stats.total} icon={BookOpen} tone="primary" />
      <StatsCard label="Bản nháp" value={stats.draft} icon={FileEdit} tone="warning" />
      <StatsCard
        label="Đang phát hành"
        value={stats.published}
        icon={CheckCircle2}
        tone="success"
      />
      <StatsCard label="Đã lưu trữ" value={stats.archived} icon={Archive} tone="muted" />
    </div>
  );
}

function CoursesResultSummary({
  promise,
  page,
  pageSize,
}: {
  promise: Promise<ListCoursesResponse>;
  page: number;
  pageSize: number;
}) {
  const { meta } = use(promise);
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <p className="text-muted-foreground mt-1 text-sm">
      {total === 0
        ? 'Chưa có khóa học nào'
        : `Hiển thị ${start}–${end} trên tổng ${total} khóa học`}
    </p>
  );
}

function CoursesTableHead({ headerFilters }: { headerFilters: CoursesHeaderFilters }) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableHead className="w-14">ID</TableHead>
        <TableHead className="w-20">Ảnh</TableHead>
        <TableHead className="min-w-50">Tiêu đề</TableHead>
        <TableHead className="w-24">Mã</TableHead>
        <ColumnFilterHead label="Giảng viên" {...headerFilters.instructorId} />
        <ColumnFilterHead label="Trạng thái" className="w-32" {...headerFilters.status} />
        <TableHead className="w-24 text-center">Nội dung</TableHead>
        <TableHead className="w-20 text-center">Học sinh</TableHead>
        <TableHead className="w-24 text-right">Hành động</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function CoursesTableFallback({ headerFilters }: { headerFilters: CoursesHeaderFilters }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <CoursesTableHead headerFilters={headerFilters} />
        <TableBody>
          <TableSkeleton columnWidths={SKELETON_COLUMNS} />
        </TableBody>
      </Table>
    </div>
  );
}

function CoursesTableSection({
  promise,
  isPending,
  headerFilters,
  onCreate,
  onDeleteRow,
}: {
  promise: Promise<ListCoursesResponse>;
  isPending: boolean;
  headerFilters: CoursesHeaderFilters;
  onCreate: () => void;
  onDeleteRow: (row: CourseRow) => void;
}) {
  const router = useRouter();
  const { data: rows, errors } = use(promise);

  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Không có khóa học nào"
        description="Tạo khóa học đầu tiên để bắt đầu xây dựng nội dung."
        action={
          <Button onClick={onCreate} className="cursor-pointer">
            <Plus /> Tạo khóa học
          </Button>
        }
      />
    );
  }

  return (
    <div
      className={cn(
        'overflow-x-auto transition-opacity',
        isPending && 'pointer-events-none opacity-60',
      )}
    >
      <Table>
        <CoursesTableHead headerFilters={headerFilters} />
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => router.push(`/admin/courses/${row.id}`)}
              className="hover:bg-muted cursor-pointer transition-colors"
            >
              <TableCell className="text-muted-foreground">{row.id}</TableCell>
              <TableCell>
                {row.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.thumbnailUrl}
                    alt={row.title}
                    loading="lazy"
                    className="size-12 rounded object-cover"
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded">
                    <BookOpen className="size-5" />
                  </div>
                )}
              </TableCell>
              <TableCell className="text-foreground font-medium">{row.title}</TableCell>
              <TableCell>
                <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                  {row.code}
                </code>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {row.instructor?.fullName ?? row.instructor?.email ?? '—'}
              </TableCell>
              <TableCell>
                <CourseStatusBadge status={row.status} />
              </TableCell>
              <TableCell className="text-center font-medium">{row.nodeCount ?? 0}</TableCell>
              <TableCell className="text-center font-medium">{row.enrollmentCount ?? 0}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  {row.status !== 'PUBLISHED' && (row.enrollmentCount ?? 0) === 0 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Xoá"
                      className="text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => onDeleteRow(row)}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CoursesPaginationSection({
  promise,
  page,
  pageSize,
  onPageChange,
}: {
  promise: Promise<ListCoursesResponse>;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { meta } = use(promise);
  const totalPages = Math.max(1, Math.ceil(meta.total / pageSize));
  return <TablePagerFooter page={page} totalPages={totalPages} onPageChange={onPageChange} />;
}

export default function CoursesPageClient({
  urlState,
  coursesPromise,
  scheduleSettings,
  instructorOptions,
}: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<CourseRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const filters = useTableFilters({ urlState, defaults: DEFAULTS });

  const confirmDelete = async () => {
    if (!deletingCourse) return;
    setDeleting(true);
    try {
      const res = await deleteCourseAction(deletingCourse.id);
      const ok = handleActionResult(res.errors, () => router.refresh(), 'Xoá khóa học thành công');
      if (ok) setDeletingCourse(null);
    } finally {
      setDeleting(false);
    }
  };

  const { page, pageSize } = urlState;

  // Lọc theo cột — dropdown ngay trên header bảng.
  const headerFilters: CoursesHeaderFilters = {
    status: {
      value: urlState.status,
      options: [...COURSE_STATUS_OPTIONS],
      onChange: (v) => filters.setValue('status', v),
    },
    instructorId: {
      value: urlState.instructorId,
      options: instructorOptions,
      onChange: (v) => filters.setValue('instructorId', v),
    },
  };

  // Chip cho các lọc không nhìn thấy trực tiếp (q đã hiện trong ô search).
  const chips: FilterChip[] = [];
  if (urlState.status !== ALL_VALUE) {
    const label = COURSE_STATUS_OPTIONS.find((o) => o.value === urlState.status)?.label;
    chips.push({ key: 'status', label: `Trạng thái: ${label ?? urlState.status}` });
  }
  if (urlState.instructorId !== ALL_VALUE) {
    const label = instructorOptions.find((o) => o.value === urlState.instructorId)?.label;
    chips.push({ key: 'instructorId', label: `Giảng viên: ${label ?? urlState.instructorId}` });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý khóa học"
        description="Tạo, quản lý nội dung và học sinh ghi danh các khóa học."
      />

      <Suspense fallback={<StatsGridSkeleton count={4} className={STATS_GRID} />}>
        <CoursesStatsSection promise={coursesPromise} />
      </Suspense>

      <ScheduleSettingsCard settings={scheduleSettings} />

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-4 pb-4">
          {/* Hàng 1: tiêu đề + hành động chính. Hàng 2: toolbar lọc, "Hiển thị" sát phải. */}
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Danh sách khóa học</CardTitle>
              <Suspense fallback={<Skeleton className="mt-1 h-4 w-60" />}>
                <CoursesResultSummary promise={coursesPromise} page={page} pageSize={pageSize} />
              </Suspense>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
              <Plus /> Tạo khóa học
            </Button>
          </div>

          {/* Thanh lọc: search gộp gõ-là-lọc + chips (trạng thái/giảng viên lọc trên cột). */}
          <div className="flex w-full flex-wrap items-center gap-2">
            <TableSearchInput
              value={filters.value('q')}
              onChange={(v) => filters.setText('q', v)}
              placeholder="Tìm theo tiêu đề hoặc mã khóa học…"
              isPending={filters.isPending}
              className="min-w-60 flex-1 sm:max-w-md"
            />
            <FilterChips
              chips={chips}
              onRemove={(key) => filters.setValue(key, ALL_VALUE)}
              onClearAll={filters.clearAll}
            />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="text-muted-foreground text-sm">Hiển thị</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => filters.setPaging({ pageSize: Number(v), page: 1 })}
              >
                <SelectTrigger className="w-20 cursor-pointer">
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
        <CardContent className="px-3 pb-0">
          <Suspense fallback={<CoursesTableFallback headerFilters={headerFilters} />}>
            <CoursesTableSection
              promise={coursesPromise}
              isPending={filters.isPending}
              headerFilters={headerFilters}
              onCreate={() => setCreateOpen(true)}
              onDeleteRow={setDeletingCourse}
            />
          </Suspense>
        </CardContent>
        <Suspense fallback={null}>
          <CoursesPaginationSection
            promise={coursesPromise}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => filters.setPaging({ page: p })}
          />
        </Suspense>
      </Card>

      <CourseFormModal open={createOpen} onOpenChange={setCreateOpen} mode="create" />

      <AlertDialog
        open={!!deletingCourse}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingCourse(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá khóa học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá khóa học{' '}
              <span className="text-foreground font-medium">{deletingCourse?.title}</span>? Thao tác
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? 'Đang xoá...' : 'Xoá khóa học'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
