'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Pencil,
  Plus,
  School,
  Trash2,
  Users as UsersIcon,
  Wallet,
  CheckCircle2,
  Lock,
} from 'lucide-react';
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
import AdvancedFiltersButton from '@/components/app/table-filters/AdvancedFiltersButton';
import ColumnFilterHead from '@/components/app/table-filters/ColumnFilterHead';
import FilterChips, { type FilterChip } from '@/components/app/table-filters/FilterChips';
import TableSearchInput from '@/components/app/table-filters/TableSearchInput';
import { useTableFilters } from '@/components/app/table-filters/useTableFilters';
import { STICKY_ACTION_CELL, STICKY_ACTION_HEAD } from '@/components/app/table-filters/sticky';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { handleActionResult } from '@/lib/actions';
import { deleteClassAction } from '@/actions/v1/classes/delete-class';
import ClassFormModal from '@/components/features/classes/ClassFormModal';
import AttendanceExportCard from '@/components/features/classes/AttendanceExportCard';
import type { ClassRow } from '@/types/class-management';
import type { ListClassesResponse } from '@/actions/v1/classes/list-classes';

export interface UrlState {
  /** Tìm gộp: tên lớp, mã lớp. */
  q: string;
  status: string;
  createdFrom: string;
  createdTo: string;
  page: number;
  pageSize: number;
  [key: string]: string | number;
}

interface Props {
  urlState: UrlState;
  classesPromise: Promise<ListClassesResponse>;
  allClasses: ClassRow[];
}

const CLASS_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'CLOSED', label: 'Đã đóng' },
] as const;

const DEFAULTS: UrlState = {
  q: '',
  status: ALL_VALUE,
  createdFrom: '',
  createdTo: '',
  page: 1,
  pageSize: 20,
};

const STATS_GRID = 'grid-cols-2 lg:grid-cols-4';
const SKELETON_COLUMNS = ['w-8', 'w-48', 'w-24', 'w-10', 'w-10', 'w-24', 'w-28', 'w-20'];

/** Lọc trạng thái gắn thẳng vào header cột. */
interface StatusHeaderFilter {
  value: string;
  onChange: (value: string) => void;
}

function ClassesStatsSection({ promise }: { promise: Promise<ListClassesResponse> }) {
  const { stats } = use(promise);
  return (
    <div className={`grid gap-3 ${STATS_GRID}`}>
      <StatsCard label="Tổng số lớp" value={stats.total} icon={School} tone="primary" />
      <StatsCard label="Đang hoạt động" value={stats.active} icon={CheckCircle2} tone="success" />
      <StatsCard label="Đã đóng" value={stats.closed} icon={Lock} tone="muted" />
      <StatsCard
        label="Tổng học sinh"
        value={stats.totalStudents}
        icon={UsersIcon}
        tone="warning"
      />
    </div>
  );
}

function ClassesResultSummary({
  promise,
  page,
  pageSize,
}: {
  promise: Promise<ListClassesResponse>;
  page: number;
  pageSize: number;
}) {
  const { meta } = use(promise);
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <p className="text-muted-foreground mt-1 text-sm">
      {total === 0 ? 'Chưa có lớp học nào' : `Hiển thị ${start}–${end} trên tổng ${total} lớp`}
    </p>
  );
}

function ClassesTableHead({ statusFilter }: { statusFilter: StatusHeaderFilter }) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableHead className="w-14">ID</TableHead>
        <TableHead>Tên lớp</TableHead>
        <TableHead>Mã lớp</TableHead>
        <TableHead className="w-32 text-center">Số học sinh</TableHead>
        <TableHead className="w-28 text-center">Số buổi học</TableHead>
        <TableHead className="w-32">Ngày tạo</TableHead>
        <ColumnFilterHead
          label="Trạng thái"
          className="w-36"
          options={[...CLASS_STATUS_OPTIONS]}
          {...statusFilter}
        />
        <TableHead className={`w-32 text-right ${STICKY_ACTION_HEAD}`}>Hành động</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function ClassesTableFallback({ statusFilter }: { statusFilter: StatusHeaderFilter }) {
  return (
    <Table>
      <ClassesTableHead statusFilter={statusFilter} />
      <TableBody>
        <TableSkeleton columnWidths={SKELETON_COLUMNS} />
      </TableBody>
    </Table>
  );
}

function ClassesTableSection({
  promise,
  isPending,
  statusFilter,
  onCreate,
  onEdit,
  onDelete,
}: {
  promise: Promise<ListClassesResponse>;
  isPending: boolean;
  statusFilter: StatusHeaderFilter;
  onCreate: () => void;
  onEdit: (row: ClassRow) => void;
  onDelete: (row: ClassRow) => void;
}) {
  const router = useRouter();
  const { data: rows, errors } = use(promise);

  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={School}
        title="Không có lớp học nào"
        description="Tạo lớp đầu tiên để bắt đầu quản lý học sinh và bài học."
        action={
          <Button onClick={onCreate} className="cursor-pointer">
            <Plus /> Tạo lớp mới
          </Button>
        }
      />
    );
  }

  return (
    <div className={cn('transition-opacity', isPending && 'pointer-events-none opacity-60')}>
      <Table>
        <ClassesTableHead statusFilter={statusFilter} />
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => router.push(`/admin/classes/${row.id}`)}
              className="group/r hover:bg-muted cursor-pointer transition-colors"
            >
              <TableCell className="text-muted-foreground">{row.id}</TableCell>
              <TableCell className="text-foreground font-medium">{row.name}</TableCell>
              <TableCell>
                <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                  {row.code}
                </code>
              </TableCell>
              <TableCell className="text-center font-medium">{row.studentCount ?? 0}</TableCell>
              <TableCell className="text-center font-medium">{row.sessionCount ?? 0}</TableCell>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {row.createdAt ? formatDate(row.createdAt) : '—'}
              </TableCell>
              <TableCell>
                <Badge variant={row.status === 'ACTIVE' ? 'success' : 'secondary'}>
                  {row.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã đóng'}
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()} className={STICKY_ACTION_CELL}>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Học phí"
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/tuition/${row.id}`)}
                  >
                    <Wallet />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Sửa"
                    className="cursor-pointer"
                    onClick={() => onEdit(row)}
                  >
                    <Pencil />
                  </Button>
                  {row.status === 'CLOSED' && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Xoá"
                      className="text-destructive hover:text-destructive cursor-pointer"
                      onClick={() => onDelete(row)}
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

function ClassesPaginationSection({
  promise,
  page,
  pageSize,
  onPageChange,
}: {
  promise: Promise<ListClassesResponse>;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { meta } = use(promise);
  const totalPages = Math.max(1, Math.ceil(meta.total / pageSize));
  return <TablePagerFooter page={page} totalPages={totalPages} onPageChange={onPageChange} />;
}

export default function ClassesPageClient({ urlState, classesPromise, allClasses }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const filters = useTableFilters({ urlState, defaults: DEFAULTS });

  const confirmDelete = async () => {
    if (!deletingClass) return;
    setDeleting(true);
    try {
      const result = await deleteClassAction(deletingClass.id);
      const ok = handleActionResult(result.errors, () => router.refresh(), 'Xoá lớp thành công');
      if (ok) setDeletingClass(null);
    } finally {
      setDeleting(false);
    }
  };

  const { page, pageSize } = urlState;

  // Lọc trạng thái ngay trên header cột thay cho ô select rời.
  const statusFilter: StatusHeaderFilter = {
    value: urlState.status,
    onChange: (v) => filters.setValue('status', v),
  };

  // Chip cho các lọc không nhìn thấy trực tiếp (q đã hiện trong ô search).
  const chips: FilterChip[] = [];
  if (urlState.status !== ALL_VALUE) {
    const label = CLASS_STATUS_OPTIONS.find((o) => o.value === urlState.status)?.label;
    chips.push({ key: 'status', label: `Trạng thái: ${label ?? urlState.status}` });
  }
  if (urlState.createdFrom) chips.push({ key: 'createdFrom', label: `Từ ${urlState.createdFrom}` });
  if (urlState.createdTo) chips.push({ key: 'createdTo', label: `Đến ${urlState.createdTo}` });

  const dateFilterCount = (urlState.createdFrom ? 1 : 0) + (urlState.createdTo ? 1 : 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý lớp học"
        description="Tạo, theo dõi và quản lý các lớp học vật lí của bạn."
      />

      <Suspense fallback={<StatsGridSkeleton count={4} className={STATS_GRID} />}>
        <ClassesStatsSection promise={classesPromise} />
      </Suspense>

      <AttendanceExportCard classes={allClasses} />

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-4 pb-4">
          {/* Hàng 1: tiêu đề + hành động chính. Hàng 2: toolbar lọc, "Hiển thị" sát phải. */}
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Danh sách lớp học</CardTitle>
              <Suspense fallback={<Skeleton className="mt-1 h-4 w-56" />}>
                <ClassesResultSummary promise={classesPromise} page={page} pageSize={pageSize} />
              </Suspense>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
              <Plus /> Tạo lớp
            </Button>
          </div>

          {/* Thanh lọc: search gộp gõ-là-lọc + khoảng ngày trong popover + chips. */}
          <div className="flex w-full flex-wrap items-center gap-2">
            <TableSearchInput
              value={filters.value('q')}
              onChange={(v) => filters.setText('q', v)}
              placeholder="Tìm theo tên hoặc mã lớp…"
              isPending={filters.isPending}
              className="min-w-60 flex-1 sm:max-w-md"
            />
            <AdvancedFiltersButton activeCount={dateFilterCount}>
              <div className="space-y-2">
                <Label htmlFor="created-from">Từ ngày</Label>
                <Input
                  id="created-from"
                  type="date"
                  value={urlState.createdFrom}
                  onChange={(e) => filters.setValue('createdFrom', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="created-to">Đến ngày</Label>
                <Input
                  id="created-to"
                  type="date"
                  value={urlState.createdTo}
                  onChange={(e) => filters.setValue('createdTo', e.target.value)}
                />
              </div>
            </AdvancedFiltersButton>
            <FilterChips
              chips={chips}
              onRemove={(key) => filters.setValue(key, key === 'status' ? ALL_VALUE : '')}
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
          <Suspense fallback={<ClassesTableFallback statusFilter={statusFilter} />}>
            <ClassesTableSection
              promise={classesPromise}
              isPending={filters.isPending}
              statusFilter={statusFilter}
              onCreate={() => setCreateOpen(true)}
              onEdit={setEditingClass}
              onDelete={setDeletingClass}
            />
          </Suspense>
        </CardContent>
        <Suspense fallback={null}>
          <ClassesPaginationSection
            promise={classesPromise}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => filters.setPaging({ page: p })}
          />
        </Suspense>
      </Card>

      <ClassFormModal open={createOpen} onOpenChange={setCreateOpen} mode="create" />

      {editingClass && (
        <ClassFormModal
          open={!!editingClass}
          onOpenChange={(open) => {
            if (!open) setEditingClass(null);
          }}
          mode="edit"
          initialData={editingClass}
        />
      )}

      <AlertDialog
        open={!!deletingClass}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingClass(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá lớp học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá lớp{' '}
              <span className="text-foreground font-medium">{deletingClass?.name}</span>? Thao tác
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
              {deleting ? 'Đang xoá...' : 'Xoá lớp'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
