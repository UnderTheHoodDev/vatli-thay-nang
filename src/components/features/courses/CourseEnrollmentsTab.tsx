'use client';

import { useEffect, useState, useTransition } from 'react';
import { RotateCcw, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import TablePagerFooter from '@/components/app/TablePagerFooter';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import AdvancedFiltersButton from '@/components/app/table-filters/AdvancedFiltersButton';
import ColumnFilterHead, {
  type ColumnFilterOption,
} from '@/components/app/table-filters/ColumnFilterHead';
import FilterChips, { type FilterChip } from '@/components/app/table-filters/FilterChips';
import TableSearchInput from '@/components/app/table-filters/TableSearchInput';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { handleActionErrors, handleActionResult, handleActionSuccess } from '@/lib/actions';
import { formatDate } from '@/lib/utils';
import { listClasses } from '@/actions/v1/classes/list-classes';
import { addCourseEnrollmentsAction } from '@/actions/v1/courses/add-course-enrollments';
import { removeCourseEnrollmentAction } from '@/actions/v1/courses/remove-course-enrollment';
import EnrollStudentsDialog from './EnrollStudentsDialog';
import type { ListMeta } from '@/types/auth';
import type { ClassRow } from '@/types/class-management';
import type { CourseEnrollmentRow } from '@/types/course-management';

interface ColumnFilter {
  value: string;
  options: ColumnFilterOption[];
  onChange: (value: string) => void;
}

/** Lọc gắn thẳng vào header cột Trạng thái (đang học / đã thu hồi). */
export type CourseEnrollmentsStatusFilter = ColumnFilter;

const SKELETON_COLUMNS = ['w-4', 'w-8', 'w-48', 'w-36', 'w-32', 'w-24', 'w-24', 'w-28'];

interface Props {
  courseId: number;
  /** Tìm gộp (OR): email, họ tên — debounce ở hook phía trên. */
  q: string;
  onQChange: (q: string) => void;
  statusFilter: CourseEnrollmentsStatusFilter;
  /** ALL_VALUE | "<classId>". */
  classId: string;
  onClassIdChange: (v: string) => void;
  enrolledFrom: string;
  enrolledTo: string;
  onEnrolledFromChange: (v: string) => void;
  onEnrolledToChange: (v: string) => void;
  onClearFilters: () => void;
  rows: CourseEnrollmentRow[];
  meta: ListMeta;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function CourseEnrollmentsTab({
  courseId,
  q,
  onQChange,
  statusFilter,
  classId,
  onClassIdChange,
  enrolledFrom,
  enrolledTo,
  onEnrolledFromChange,
  onEnrolledToChange,
  onClearFilters,
  rows,
  meta,
  loading,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const [classOptions, setClassOptions] = useState<ClassRow[]>([]);
  useEffect(() => {
    listClasses({ status: 'ACTIVE', pageSize: 200 }).then((res) => setClassOptions(res.data));
  }, []);

  const [target, setTarget] = useState<CourseEnrollmentRow | null>(null);
  const [restoring, setRestoring] = useState<CourseEnrollmentRow | null>(null);
  const [bulkRevokeOpen, setBulkRevokeOpen] = useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  // rows đổi -> bỏ chọn (adjust state trong render, không dùng effect).
  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setSelected(new Set());
  }

  function confirmRevoke() {
    if (!target) return;
    const studentId = target.studentId;
    startTransition(async () => {
      const res = await removeCourseEnrollmentAction(courseId, studentId);
      const ok = handleActionResult(res.errors, undefined, 'Đã thu hồi ghi danh');
      if (ok) setTarget(null);
    });
  }

  function confirmRestore() {
    if (!restoring) return;
    const studentId = restoring.studentId;
    startTransition(async () => {
      const res = await addCourseEnrollmentsAction(courseId, { studentIds: [studentId] });
      const ok = handleActionResult(res.errors, undefined, 'Đã khôi phục ghi danh');
      if (ok) setRestoring(null);
    });
  }

  function confirmBulkRestore() {
    if (selectedRows.length === 0) return;
    const studentIds = selectedRows.map((r) => r.studentId);
    startTransition(async () => {
      const res = await addCourseEnrollmentsAction(courseId, { studentIds });
      const ok = handleActionResult(
        res.errors,
        undefined,
        `Đã khôi phục ghi danh cho ${studentIds.length} học sinh`,
      );
      if (ok) {
        setBulkRestoreOpen(false);
        setSelected(new Set());
      }
    });
  }

  function confirmBulkRevoke() {
    if (selectedRows.length === 0) return;
    startTransition(async () => {
      const results = await Promise.all(
        selectedRows.map(async (r) => ({
          row: r,
          res: await removeCourseEnrollmentAction(courseId, r.studentId),
        })),
      );
      const failed = results.filter((r) => r.res.errors.length > 0);
      const succeededCount = results.length - failed.length;
      if (succeededCount > 0) {
        handleActionSuccess(
          failed.length === 0
            ? `Đã thu hồi ghi danh của ${succeededCount} học sinh`
            : `Đã thu hồi cho ${succeededCount}/${results.length} học sinh`,
        );
      }
      failed.forEach((f) =>
        handleActionErrors(f.res.errors.map((msg) => `${f.row.fullName ?? f.row.email}: ${msg}`)),
      );
      if (succeededCount > 0) {
        setBulkRevokeOpen(false);
        setSelected(new Set());
      }
    });
  }

  const rowIds = rows.map((r) => r.studentId);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const someSelected = rowIds.some((id) => selected.has(id));

  const selectedRows = rows.filter((r) => selected.has(r.studentId));
  const allSelectedActive =
    selectedRows.length > 0 && selectedRows.every((r) => r.status === 'ACTIVE');
  const allSelectedRevoked =
    selectedRows.length > 0 && selectedRows.every((r) => r.status === 'REVOKED');

  function toggleAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) rowIds.forEach((id) => next.add(id));
      else rowIds.forEach((id) => next.delete(id));
      return next;
    });
  }

  function toggleOne(id: number, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const { page, pageSize, total } = meta;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hasActiveFilter =
    !!q.trim() ||
    classId !== ALL_VALUE ||
    !!enrolledFrom ||
    !!enrolledTo ||
    statusFilter.value !== ALL_VALUE;

  const advancedActiveCount = (enrolledFrom ? 1 : 0) + (enrolledTo ? 1 : 0);

  const classFilter: ColumnFilter = {
    value: classId,
    options: classOptions.map((c) => ({ value: String(c.id), label: c.name })),
    onChange: onClassIdChange,
  };

  const chips: FilterChip[] = [];
  if (classId !== ALL_VALUE) {
    const cls = classOptions.find((c) => String(c.id) === classId);
    chips.push({ key: 'classId', label: `Lớp: ${cls ? cls.name : classId}` });
  }
  if (enrolledFrom) chips.push({ key: 'enrolledFrom', label: `Từ ${enrolledFrom}` });
  if (enrolledTo) chips.push({ key: 'enrolledTo', label: `Đến ${enrolledTo}` });
  if (statusFilter.value !== ALL_VALUE) {
    chips.push({
      key: 'status',
      label: `Trạng thái: ${statusFilter.value === 'ACTIVE' ? 'Đang học' : 'Đã thu hồi'}`,
    });
  }

  function removeChip(key: string) {
    if (key === 'classId') onClassIdChange(ALL_VALUE);
    else if (key === 'enrolledFrom') onEnrolledFromChange('');
    else if (key === 'enrolledTo') onEnrolledToChange('');
    else if (key === 'status') statusFilter.onChange(ALL_VALUE);
  }

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="flex flex-col items-stretch gap-3 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Học sinh đã ghi danh</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {loading
                ? 'Đang tải...'
                : total === 0
                  ? 'Chưa có học sinh nào ghi danh'
                  : `Hiển thị ${start}–${end} trên tổng ${total} học sinh`}
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
            <EnrollStudentsDialog courseId={courseId} />
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2">
          <TableSearchInput
            value={q}
            onChange={onQChange}
            placeholder="Tìm theo email hoặc họ tên…"
            isPending={loading}
            className="min-w-60 flex-1 sm:max-w-sm"
          />
          <AdvancedFiltersButton activeCount={advancedActiveCount}>
            <div className="space-y-2">
              <Label htmlFor="enrolled-from">Ghi danh từ ngày</Label>
              <Input
                id="enrolled-from"
                type="date"
                value={enrolledFrom}
                onChange={(e) => onEnrolledFromChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrolled-to">Ghi danh đến ngày</Label>
              <Input
                id="enrolled-to"
                type="date"
                value={enrolledTo}
                onChange={(e) => onEnrolledToChange(e.target.value)}
              />
            </div>
          </AdvancedFiltersButton>
          <FilterChips chips={chips} onRemove={removeChip} onClearAll={onClearFilters} />
        </div>

        {selected.size > 0 && (
          <div className="bg-muted/40 border-divider flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <span className="text-foreground text-sm font-medium">
              Đã chọn {selected.size} học sinh
            </span>
            <div className="flex items-center gap-3">
              {allSelectedActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive cursor-pointer"
                  onClick={() => setBulkRevokeOpen(true)}
                >
                  <Trash2 /> Thu hồi hàng loạt
                </Button>
              )}
              {allSelectedRevoked && (
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setBulkRestoreOpen(true)}
                >
                  <RotateCcw /> Khôi phục hàng loạt
                </Button>
              )}
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-muted-foreground hover:text-foreground cursor-pointer text-xs underline"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-0">
        {!loading && rows.length === 0 && !hasActiveFilter ? (
          <EmptyState
            icon={UserPlus}
            title="Chưa có học sinh nào ghi danh"
            description='Dùng nút "Thêm học sinh" để ghi danh học sinh vào khóa học.'
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-8">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                      onCheckedChange={(checked) => toggleAll(checked === true)}
                      aria-label="Chọn tất cả học sinh trong trang"
                    />
                  </TableHead>
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <ColumnFilterHead
                    label="Lớp"
                    className="w-40"
                    allLabel="Tất cả"
                    {...classFilter}
                  />
                  <ColumnFilterHead label="Trạng thái" className="w-32" {...statusFilter} />
                  <TableHead>Ngày ghi danh</TableHead>
                  <TableHead className="w-40 text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton columnWidths={SKELETON_COLUMNS} />
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground py-10 text-center text-sm"
                    >
                      Không có học sinh nào khớp bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(e.studentId)}
                          onCheckedChange={(checked) => toggleOne(e.studentId, checked === true)}
                          aria-label={`Chọn ${e.fullName ?? e.email}`}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{e.studentId}</TableCell>
                      <TableCell className="text-foreground font-medium">{e.email}</TableCell>
                      <TableCell>{e.fullName ?? '—'}</TableCell>
                      <TableCell>
                        {e.classes.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {e.classes.map((c) => (
                              <Badge key={c.id} variant="secondary">
                                {c.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {e.status === 'ACTIVE' ? 'Đang học' : 'Đã thu hồi'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(e.enrolledAt)}</TableCell>
                      <TableCell className="text-right">
                        {e.status === 'ACTIVE' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive cursor-pointer"
                            onClick={() => setTarget(e)}
                            disabled={pending}
                          >
                            <Trash2 /> Thu hồi
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setRestoring(e)}
                            disabled={pending}
                          >
                            <RotateCcw /> Khôi phục
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <TablePagerFooter page={page} totalPages={totalPages} onPageChange={onPageChange} />

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thu hồi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn thu hồi ghi danh của học sinh{' '}
              <span className="text-foreground font-medium">
                {target?.fullName ?? target?.email}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRevoke();
              }}
              disabled={pending}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {pending ? 'Đang xử lý...' : 'Thu hồi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkRevokeOpen} onOpenChange={setBulkRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thu hồi hàng loạt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn thu hồi ghi danh của{' '}
              <span className="text-foreground font-medium">{selectedRows.length} học sinh</span> đã
              chọn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmBulkRevoke();
              }}
              disabled={pending}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {pending ? 'Đang xử lý...' : `Thu hồi (${selectedRows.length})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoring !== null} onOpenChange={(open) => !open && setRestoring(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục ghi danh</AlertDialogTitle>
            <AlertDialogDescription>
              Khôi phục ghi danh của học sinh{' '}
              <span className="text-foreground font-medium">
                {restoring?.fullName ?? restoring?.email}
              </span>{' '}
              vào khóa học này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRestore();
              }}
              disabled={pending}
              className="cursor-pointer"
            >
              {pending ? 'Đang xử lý...' : 'Khôi phục'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkRestoreOpen} onOpenChange={setBulkRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục ghi danh hàng loạt</AlertDialogTitle>
            <AlertDialogDescription>
              Khôi phục ghi danh của{' '}
              <span className="text-foreground font-medium">{selectedRows.length} học sinh</span> đã
              chọn vào khóa học này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmBulkRestore();
              }}
              disabled={pending}
              className="cursor-pointer"
            >
              {pending ? 'Đang xử lý...' : `Khôi phục (${selectedRows.length})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
