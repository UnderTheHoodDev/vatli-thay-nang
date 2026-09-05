'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { CalendarClock, Pencil } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PageHeader from '@/components/app/PageHeader';
import TablePagerFooter from '@/components/app/TablePagerFooter';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import AdvancedFiltersButton from '@/components/app/table-filters/AdvancedFiltersButton';
import ColumnFilterHead from '@/components/app/table-filters/ColumnFilterHead';
import FilterChips, { type FilterChip } from '@/components/app/table-filters/FilterChips';
import TableSearchInput from '@/components/app/table-filters/TableSearchInput';
import { useTableFilters } from '@/components/app/table-filters/useTableFilters';
import { STICKY_ACTION_CELL, STICKY_ACTION_HEAD } from '@/components/app/table-filters/sticky';
import AttendanceToggle from '@/components/features/class-sessions/AttendanceToggle';
import ClassSessionFormModal from '@/components/features/class-sessions/ClassSessionFormModal';
import DeleteClassSessionButton from '@/components/features/class-sessions/DeleteClassSessionButton';
import { useIsTeachingAssistant } from '@/components/app/RoleProvider';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { CLASS_SESSION_STATUS_MAP, getEffectiveStatus } from '@/lib/class-sessions';
import { formatDateTime } from '@/lib/format';
import type { ClassRow } from '@/types/class-management';
import type { ClassSessionListRowWithClass } from '@/types/actions/class-management';
import type { ListAllClassSessionsResponse } from '@/actions/v1/class-sessions/list-all-class-sessions';

export interface UrlState {
  /** Tìm gộp: tiêu đề buổi học. */
  q: string;
  classCode: string;
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  [key: string]: string | number;
}

interface Props {
  urlState: UrlState;
  sessionsPromise: Promise<ListAllClassSessionsResponse>;
  classes: ClassRow[];
}

const DEFAULTS: UrlState = {
  q: '',
  classCode: '',
  startDate: '',
  endDate: '',
  page: 1,
  pageSize: 20,
};

/** Lọc mã lớp gắn thẳng vào header cột. */
interface ClassCodeHeaderFilter {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

const SKELETON_COLUMNS = ['w-8', 'w-24', 'w-48', 'w-40', 'w-40', 'w-28', 'w-24', 'w-32'];

function SessionsResultSummary({
  promise,
  page,
  pageSize,
}: {
  promise: Promise<ListAllClassSessionsResponse>;
  page: number;
  pageSize: number;
}) {
  const { meta } = use(promise);
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <p className="text-muted-foreground mt-1 text-sm">
      {total === 0 ? 'Không có buổi học nào' : `Hiển thị ${start}–${end} trên tổng ${total} buổi`}
    </p>
  );
}

function SessionsTableHead({ classCodeFilter }: { classCodeFilter: ClassCodeHeaderFilter }) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableHead className="w-14">ID</TableHead>
        <ColumnFilterHead label="Mã lớp" className="w-32" {...classCodeFilter} />
        <TableHead>Tiêu đề</TableHead>
        <TableHead className="w-40">Bắt đầu</TableHead>
        <TableHead className="w-40">Kết thúc</TableHead>
        {/* Trạng thái được suy ra ở client từ giờ bắt đầu/kết thúc — BE không lọc được. */}
        <TableHead className="w-32">Trạng thái</TableHead>
        <TableHead className="w-24 text-center">Điểm danh</TableHead>
        <TableHead className={`w-48 ${STICKY_ACTION_HEAD}`}>Hành động</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function SessionsTableFallback({ classCodeFilter }: { classCodeFilter: ClassCodeHeaderFilter }) {
  return (
    <Table>
      <SessionsTableHead classCodeFilter={classCodeFilter} />
      <TableBody>
        <TableSkeleton columnWidths={SKELETON_COLUMNS} />
      </TableBody>
    </Table>
  );
}

function SessionsTableSection({
  promise,
  isPending,
  classCodeFilter,
  canManage,
  onEdit,
}: {
  promise: Promise<ListAllClassSessionsResponse>;
  isPending: boolean;
  classCodeFilter: ClassCodeHeaderFilter;
  canManage: boolean;
  onEdit: (row: ClassSessionListRowWithClass) => void;
}) {
  const router = useRouter();
  const { data: rows, errors } = use(promise);

  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Không có buổi học nào"
        description="Thử thay đổi bộ lọc để xem kết quả khác."
      />
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('transition-opacity', isPending && 'pointer-events-none opacity-60')}>
        <Table>
          <SessionsTableHead classCodeFilter={classCodeFilter} />
          <TableBody>
            {rows.map((row) => {
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
                  className="group/r hover:bg-muted cursor-pointer transition-colors"
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
                    {formatDateTime(row.startTime)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(row.endTime)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    <span
                      className={
                        (row.totalStudents ?? 0) > 0 &&
                        (row.attendedCount ?? 0) >= (row.totalStudents ?? 0)
                          ? 'text-emerald-600'
                          : (row.attendedCount ?? 0) === 0
                            ? 'text-muted-foreground'
                            : 'text-amber-600'
                      }
                    >
                      {row.attendedCount ?? 0}/{row.totalStudents ?? 0}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className={STICKY_ACTION_CELL}>
                    <div className="flex items-center gap-1.5">
                      <AttendanceToggle
                        classSessionId={row.id}
                        startTime={row.startTime}
                        endTime={row.endTime}
                        activeAttendanceSession={row.activeAttendanceSession ?? null}
                        onChanged={() => router.refresh()}
                      />
                      {canManage && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon-sm"
                                variant="outline"
                                className="cursor-pointer"
                                aria-label="Sửa buổi học"
                                onClick={() => onEdit(row)}
                              >
                                <Pencil />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Sửa buổi học</TooltipContent>
                          </Tooltip>
                          <DeleteClassSessionButton
                            sessionId={row.id}
                            classId={row.classId}
                            title={row.title}
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

function SessionsPaginationSection({
  promise,
  page,
  pageSize,
  onPageChange,
}: {
  promise: Promise<ListAllClassSessionsResponse>;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { meta } = use(promise);
  const totalPages = Math.max(1, Math.ceil(meta.total / pageSize));
  return <TablePagerFooter page={page} totalPages={totalPages} onPageChange={onPageChange} />;
}

export default function ClassSessionsAllPageClient({ urlState, sessionsPromise, classes }: Props) {
  const isTA = useIsTeachingAssistant();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSessionListRowWithClass | null>(null);
  const filters = useTableFilters({ urlState, defaults: DEFAULTS });

  const { page, pageSize } = urlState;

  // Lọc mã lớp ngay trên header cột; ALL_VALUE của dropdown quy về '' vì URL
  // dùng chuỗi rỗng làm "không lọc".
  const classCodeFilter: ClassCodeHeaderFilter = {
    value: urlState.classCode,
    options: classes.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
    onChange: (v) => filters.setValue('classCode', v === ALL_VALUE ? '' : v),
  };

  // Chip cho các lọc không nhìn thấy trực tiếp (q đã hiện trong ô search).
  const chips: FilterChip[] = [];
  if (urlState.classCode) chips.push({ key: 'classCode', label: `Lớp: ${urlState.classCode}` });
  if (urlState.startDate) chips.push({ key: 'startDate', label: `Từ ${urlState.startDate}` });
  if (urlState.endDate) chips.push({ key: 'endDate', label: `Đến ${urlState.endDate}` });

  const dateFilterCount = (urlState.startDate ? 1 : 0) + (urlState.endDate ? 1 : 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Danh sách buổi học" description="Tổng hợp tất cả buổi học trên mọi lớp." />

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-4 pb-4">
          {/* Hàng 1: tiêu đề + hành động chính. Hàng 2: toolbar lọc, "Hiển thị" sát phải. */}
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Kết quả</CardTitle>
              <Suspense fallback={<Skeleton className="mt-1 h-4 w-56" />}>
                <SessionsResultSummary promise={sessionsPromise} page={page} pageSize={pageSize} />
              </Suspense>
            </div>
            {!isTA && (
              <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
                Tạo buổi học
              </Button>
            )}
          </div>

          {/* Thanh lọc: search gộp gõ-là-lọc + khoảng ngày trong popover + chips. */}
          <div className="flex w-full flex-wrap items-center gap-2">
            <TableSearchInput
              value={filters.value('q')}
              onChange={(v) => filters.setText('q', v)}
              placeholder="Tìm theo tiêu đề buổi học…"
              isPending={filters.isPending}
              className="min-w-60 flex-1 sm:max-w-md"
            />
            <AdvancedFiltersButton activeCount={dateFilterCount}>
              <div className="space-y-2">
                <Label htmlFor="search-start">Từ ngày</Label>
                <Input
                  id="search-start"
                  type="date"
                  value={urlState.startDate}
                  onChange={(e) => filters.setValue('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-end">Đến ngày</Label>
                <Input
                  id="search-end"
                  type="date"
                  value={urlState.endDate}
                  onChange={(e) => filters.setValue('endDate', e.target.value)}
                />
              </div>
            </AdvancedFiltersButton>
            <FilterChips
              chips={chips}
              onRemove={(key) => filters.setValue(key, '')}
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
        <CardContent className="px-4 pb-4 sm:px-3">
          <Suspense fallback={<SessionsTableFallback classCodeFilter={classCodeFilter} />}>
            <SessionsTableSection
              promise={sessionsPromise}
              isPending={filters.isPending}
              classCodeFilter={classCodeFilter}
              canManage={!isTA}
              onEdit={setEditingSession}
            />
          </Suspense>
        </CardContent>
        <Suspense fallback={null}>
          <SessionsPaginationSection
            promise={sessionsPromise}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => filters.setPaging({ page: p })}
          />
        </Suspense>
      </Card>

      <ClassSessionFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        classes={classes}
      />

      {editingSession && (
        <ClassSessionFormModal
          open={!!editingSession}
          onOpenChange={(open) => {
            if (!open) setEditingSession(null);
          }}
          mode="edit"
          classId={editingSession.classId}
          initialData={editingSession}
        />
      )}
    </div>
  );
}
