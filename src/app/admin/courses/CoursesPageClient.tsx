'use client';

import { Suspense, use, useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Archive, BookOpen, CheckCircle2, FileEdit, Plus, Search, Trash2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { handleActionResult } from '@/lib/actions';
import { deleteCourseAction } from '@/actions/v1/courses/delete-course';
import CourseFormModal from '@/components/features/courses/CourseFormModal';
import type { CourseCategoryRow, CourseRow } from '@/types/course-management';
import { COURSE_STATUS_OPTIONS } from '@/types/course-management';
import CourseStatusBadge from '@/components/features/courses/CourseStatusBadge';
import type { ListCoursesResponse } from '@/actions/v1/courses/list-courses';
import ScheduleSettingsCard from '@/components/features/schedule-settings/ScheduleSettingsCard';
import type { IScheduleSettings } from '@/types/actions/schedule-settings';

export interface UrlState {
  title: string;
  code: string;
  categoryId: string;
  status: string;
  page: number;
  pageSize: number;
}

interface Props {
  urlState: UrlState;
  coursesPromise: Promise<ListCoursesResponse>;
  categories: CourseCategoryRow[];
  scheduleSettings: IScheduleSettings | null;
}

function buildUrlParams(state: UrlState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.title) sp.set('title', state.title);
  if (state.code) sp.set('code', state.code);
  if (state.categoryId && state.categoryId !== ALL_VALUE) sp.set('categoryId', state.categoryId);
  if (state.status && state.status !== ALL_VALUE) sp.set('status', state.status);
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== 20) sp.set('pageSize', String(state.pageSize));
  return sp;
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

function CoursesTableHead() {
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableHead className="w-14">ID</TableHead>
        <TableHead className="w-20">Ảnh</TableHead>
        <TableHead className="min-w-50">Tiêu đề</TableHead>
        <TableHead className="w-24">Mã</TableHead>
        <TableHead>Danh mục</TableHead>
        <TableHead>Giảng viên</TableHead>
        <TableHead className="w-32">Trạng thái</TableHead>
        <TableHead className="w-24 text-center">Nội dung</TableHead>
        <TableHead className="w-20 text-center">Học sinh</TableHead>
        <TableHead className="w-24 text-right">Hành động</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function CoursesTableFallback() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <CoursesTableHead />
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
  onCreate,
  onDeleteRow,
}: {
  promise: Promise<ListCoursesResponse>;
  isPending: boolean;
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
        <CoursesTableHead />
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
                {row.category?.name ?? '—'}
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
  categories,
  scheduleSettings,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<CourseRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [searchTitle, setSearchTitle] = useState(urlState.title);
  const [searchCode, setSearchCode] = useState(urlState.code);
  const [searchCategory, setSearchCategory] = useState(urlState.categoryId);
  const [searchStatus, setSearchStatus] = useState(urlState.status);

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
      title: searchTitle,
      code: searchCode,
      categoryId: searchCategory,
      status: searchStatus,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setSearchTitle('');
    setSearchCode('');
    setSearchCategory(ALL_VALUE);
    setSearchStatus(ALL_VALUE);
    updateUrl({
      title: '',
      code: '',
      categoryId: ALL_VALUE,
      status: ALL_VALUE,
      page: 1,
    });
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="search-title">Tên khóa học</Label>
              <Input
                id="search-title"
                placeholder="Tìm theo tên khóa học..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search-code">Mã khóa học</Label>
              <Input
                id="search-code"
                placeholder="Tìm theo mã..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Tất cả</SelectItem>
                  {COURSE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:col-span-2 sm:flex-row lg:col-span-4">
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
            <CardTitle>Danh sách khóa học</CardTitle>
            <Suspense fallback={<Skeleton className="mt-1 h-4 w-60" />}>
              <CoursesResultSummary promise={coursesPromise} page={page} pageSize={pageSize} />
            </Suspense>
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
              <Plus /> Tạo khóa học
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          <Suspense fallback={<CoursesTableFallback />}>
            <CoursesTableSection
              promise={coursesPromise}
              isPending={isPending}
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
            onPageChange={(p) => updateUrl({ page: p })}
          />
        </Suspense>
      </Card>

      <CourseFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        categories={categories}
      />

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
