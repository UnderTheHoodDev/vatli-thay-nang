'use client';

import { useMemo, useState, useTransition } from 'react';
import { CalendarCog, RotateCcw, Tags, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/app/EmptyState';
import { useIsTeachingAssistant } from '@/components/app/RoleProvider';
import TableSkeleton from '@/components/app/TableSkeleton';
import ColumnFilterHead, {
  type ColumnFilterOption,
} from '@/components/app/table-filters/ColumnFilterHead';
import AttendanceSummaryCell from './AttendanceSummaryCell';
import BulkMarkStudentsLeftModal from './BulkMarkStudentsLeftModal';
import ClassGroupBadge from './ClassGroupBadge';
import ClassStudentStatusBadge from './ClassStudentStatusBadge';
import EnrollmentDateModal from './EnrollmentDateModal';
import MarkStudentLeftModal from './MarkStudentLeftModal';
import { assignClassGroupAction } from '@/actions/v1/classes/assign-class-group';
import { removeStudentAction } from '@/actions/v1/classes/remove-student';
import { restoreStudentAction } from '@/actions/v1/classes/restore-student';
import { handleActionErrors, handleActionResult, handleActionSuccess } from '@/lib/actions';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ClassAttendanceStudentRow } from '@/types/actions/attendance';
import type { ClassGroupRow, ClassStudentListRow } from '@/types/actions/class-management';

const SKELETON_COLUMNS = [
  'w-6',
  'w-14',
  'w-48',
  'w-36',
  'w-28',
  'w-28',
  'w-32',
  'w-24',
  'w-32',
  'w-44',
];

/** Ngoài module — tránh bị tạo lại mỗi lần render. */
function GroupMenuItems({
  groups,
  onPick,
}: {
  groups: ClassGroupRow[];
  onPick: (classGroupId: number | null) => void;
}) {
  return (
    <>
      {groups.map((g) => (
        <DropdownMenuItem key={g.id} onClick={() => onPick(g.id)} className="cursor-pointer">
          <ClassGroupBadge group={g} />
        </DropdownMenuItem>
      ))}
      {groups.length > 0 && <DropdownMenuSeparator />}
      <DropdownMenuItem onClick={() => onPick(null)} className="cursor-pointer">
        <ClassGroupBadge group={null} />
      </DropdownMenuItem>
    </>
  );
}

/** Lọc gắn thẳng vào header cột Trạng thái (đang học / đã nghỉ). */
export interface ClassStudentsStatusFilter {
  value: string;
  options: ColumnFilterOption[];
  onChange: (value: string) => void;
}

/** Lọc gắn thẳng vào header cột Nhóm — value là ALL_VALUE | GROUP_UNASSIGNED_VALUE | "<classGroupId>". */
export interface ClassStudentsGroupFilter {
  value: string;
  options: ColumnFilterOption[];
  onChange: (value: string) => void;
}

interface Props {
  classId: number;
  rows: ClassStudentListRow[];
  groups: ClassGroupRow[];
  attendanceStats?: ClassAttendanceStudentRow[];
  loading?: boolean;
  /** Không truyền = header tĩnh (dùng ở ngữ cảnh không có URL filter). */
  statusFilter?: ClassStudentsStatusFilter;
  groupFilter?: ClassStudentsGroupFilter;
  /** true = rows rỗng vì đang lọc, không phải vì lớp chưa có học sinh nào. */
  hasActiveFilter?: boolean;
}

export default function ClassStudentsTable({
  classId,
  rows,
  groups,
  attendanceStats,
  loading,
  statusFilter,
  groupFilter,
  hasActiveFilter,
}: Props) {
  const isTA = useIsTeachingAssistant();
  const attendanceByStudent = useMemo(
    () => new Map((attendanceStats ?? []).map((s) => [s.studentId, s])),
    [attendanceStats],
  );
  const [target, setTarget] = useState<ClassStudentListRow | null>(null);
  const [editingEnrollment, setEditingEnrollment] = useState<ClassStudentListRow | null>(null);
  const [markingLeft, setMarkingLeft] = useState<ClassStudentListRow | null>(null);
  const [restoring, setRestoring] = useState<ClassStudentListRow | null>(null);
  const [bulkMarkingLeft, setBulkMarkingLeft] = useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [groupPending, startGroupTransition] = useTransition();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  // rows đổi -> bỏ chọn (adjust state trong render, không dùng effect).
  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setSelected(new Set());
  }

  function confirmRemove() {
    if (!target) return;
    const studentId = target.studentId;
    startTransition(async () => {
      const res = await removeStudentAction(classId, studentId);
      const ok = handleActionResult(res.errors, undefined, 'Đã xoá học sinh khỏi lớp');
      if (ok) setTarget(null);
    });
  }

  function confirmRestore() {
    if (!restoring) return;
    const studentId = restoring.studentId;
    startTransition(async () => {
      const res = await restoreStudentAction(classId, studentId);
      const ok = handleActionResult(res.errors, undefined, 'Đã khôi phục trạng thái đang học');
      if (ok) setRestoring(null);
    });
  }

  function confirmBulkRestore() {
    if (selectedRows.length === 0) return;
    startTransition(async () => {
      const results = await Promise.all(
        selectedRows.map(async (r) => ({
          row: r,
          res: await restoreStudentAction(classId, r.studentId),
        })),
      );
      const failed = results.filter((r) => r.res.errors.length > 0);
      const succeededCount = results.length - failed.length;
      if (succeededCount > 0) {
        handleActionSuccess(
          failed.length === 0
            ? `Đã khôi phục trạng thái đang học cho ${succeededCount} học sinh`
            : `Đã khôi phục cho ${succeededCount}/${results.length} học sinh`,
        );
      }
      failed.forEach((f) =>
        handleActionErrors(f.res.errors.map((msg) => `${f.row.fullName ?? f.row.email}: ${msg}`)),
      );
      if (succeededCount > 0) {
        setBulkRestoreOpen(false);
        setSelected(new Set());
      }
    });
  }

  function runAssign(studentIds: number[], classGroupId: number | null, onSuccess?: () => void) {
    startGroupTransition(async () => {
      const res = await assignClassGroupAction(classId, { studentIds, classGroupId });
      const message =
        studentIds.length > 1
          ? `Đã cập nhật nhóm cho ${studentIds.length} học sinh`
          : 'Đã cập nhật nhóm';
      const ok = handleActionResult(res.errors, undefined, message);
      if (ok) onSuccess?.();
    });
  }

  function assignOne(studentId: number, classGroupId: number | null) {
    runAssign([studentId], classGroupId);
  }

  function bulkAssign(classGroupId: number | null) {
    const studentIds = [...selected];
    if (studentIds.length === 0) return;
    runAssign(studentIds, classGroupId, () => setSelected(new Set()));
  }

  const rowIds = rows.map((s) => s.studentId);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const someSelected = rowIds.some((id) => selected.has(id));

  const selectedRows = rows.filter((s) => selected.has(s.studentId));
  // Trạng thái lẫn lộn (vừa đang học vừa đã nghỉ) -> không hành động nào rõ nghĩa, ẩn cả hai nút.
  const allSelectedStudying =
    selectedRows.length > 0 && selectedRows.every((s) => s.status === 'STUDYING');
  const allSelectedLeft = selectedRows.length > 0 && selectedRows.every((s) => s.status === 'LEFT');

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

  if (!loading && rows.length === 0 && !hasActiveFilter) {
    return (
      <EmptyState
        icon={UserPlus}
        title="Chưa có học sinh nào trong lớp"
        description={
          isTA
            ? 'Lớp học này hiện chưa có học sinh nào.'
            : 'Sử dụng nút "Thêm học sinh" ở trên để bắt đầu thêm học sinh vào lớp.'
        }
      />
    );
  }

  const columnCount = 8 + (isTA ? 0 : 2);

  return (
    <>
      {!isTA && selected.size > 0 && (
        <div className="bg-muted/40 border-divider mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <span className="text-foreground text-sm font-medium">
            Đã chọn {selected.size} học sinh
          </span>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={groupPending}
                >
                  <Tags /> Gán vào nhóm
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <GroupMenuItems groups={groups} onPick={bulkAssign} />
              </DropdownMenuContent>
            </DropdownMenu>
            {allSelectedStudying && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setBulkMarkingLeft(true)}
              >
                <UserMinus /> Đánh dấu nghỉ học
              </Button>
            )}
            {allSelectedLeft && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setBulkRestoreOpen(true)}
              >
                <RotateCcw /> Khôi phục đang học
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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {!isTA && (
                <TableHead className="w-8">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="Chọn tất cả học sinh trong trang"
                  />
                </TableHead>
              )}
              <TableHead className="w-14">ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Ngày vào học</TableHead>
              <TableHead>Ngày nghỉ học</TableHead>
              {groupFilter ? (
                <ColumnFilterHead label="Nhóm" {...groupFilter} />
              ) : (
                <TableHead>Nhóm</TableHead>
              )}
              {statusFilter ? (
                <ColumnFilterHead label="Trạng thái" {...statusFilter} />
              ) : (
                <TableHead>Trạng thái</TableHead>
              )}
              <TableHead>Chuyên cần</TableHead>
              {!isTA && <TableHead className="w-44 text-right">Hành động</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columnWidths={SKELETON_COLUMNS} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  Không có học sinh nào khớp bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.studentId} className={cn(s.status === 'LEFT' && 'opacity-60')}>
                  {!isTA && (
                    <TableCell>
                      <Checkbox
                        checked={selected.has(s.studentId)}
                        onCheckedChange={(checked) => toggleOne(s.studentId, checked === true)}
                        aria-label={`Chọn ${s.fullName ?? s.email}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">{s.studentId}</TableCell>
                  <TableCell className="text-foreground font-medium">{s.email}</TableCell>
                  <TableCell>{s.fullName ?? '—'}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(s.enrollmentDate ?? s.createdAt)}
                    {!s.enrollmentDate && (
                      <span className="text-muted-foreground ml-1 text-xs">(theo ngày thêm)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatDate(s.leftAt)}
                  </TableCell>
                  <TableCell>
                    {isTA ? (
                      <ClassGroupBadge group={s.classGroup} />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={groupPending}>
                          <button
                            type="button"
                            className="cursor-pointer rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <ClassGroupBadge group={s.classGroup} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <GroupMenuItems
                            groups={groups}
                            onPick={(id) => assignOne(s.studentId, id)}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                  <TableCell>
                    <ClassStudentStatusBadge status={s.status} />
                  </TableCell>
                  <TableCell>
                    <AttendanceSummaryCell stats={attendanceByStudent.get(s.studentId)} />
                  </TableCell>
                  {!isTA && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Sửa ngày vào học"
                          className="cursor-pointer"
                          disabled={pending}
                          onClick={() => setEditingEnrollment(s)}
                        >
                          <CalendarCog />
                        </Button>
                        {s.status === 'STUDYING' ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Đánh dấu nghỉ học"
                            className="cursor-pointer"
                            disabled={pending}
                            onClick={() => setMarkingLeft(s)}
                          >
                            <UserMinus />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Khôi phục trạng thái đang học"
                            className="cursor-pointer"
                            disabled={pending}
                            onClick={() => setRestoring(s)}
                          >
                            <RotateCcw />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Xoá khỏi lớp"
                          className="text-destructive hover:text-destructive cursor-pointer"
                          disabled={pending}
                          onClick={() => setTarget(s)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá học sinh</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá học sinh{' '}
              <span className="text-foreground font-medium">
                {target?.fullName ?? target?.email}
              </span>{' '}
              khỏi lớp này không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRemove();
              }}
              disabled={pending}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {pending ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoring !== null} onOpenChange={(open) => !open && setRestoring(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục trạng thái đang học</AlertDialogTitle>
            <AlertDialogDescription>
              Đưa{' '}
              <span className="text-foreground font-medium">
                {restoring?.fullName ?? restoring?.email}
              </span>{' '}
              về trạng thái đang học? Ngày nghỉ học đã ghi trước đó sẽ bị xoá.
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

      {editingEnrollment && (
        <EnrollmentDateModal
          classId={classId}
          student={editingEnrollment}
          open
          onOpenChange={(o) => !o && setEditingEnrollment(null)}
        />
      )}
      {markingLeft && (
        <MarkStudentLeftModal
          classId={classId}
          student={markingLeft}
          open
          onOpenChange={(o) => !o && setMarkingLeft(null)}
        />
      )}
      {bulkMarkingLeft && (
        <BulkMarkStudentsLeftModal
          classId={classId}
          students={selectedRows}
          open
          onOpenChange={(o) => {
            setBulkMarkingLeft(o);
            if (!o) setSelected(new Set());
          }}
        />
      )}

      <AlertDialog open={bulkRestoreOpen} onOpenChange={setBulkRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục trạng thái đang học</AlertDialogTitle>
            <AlertDialogDescription>
              Đưa{' '}
              <span className="text-foreground font-medium">{selectedRows.length} học sinh</span> đã
              chọn về trạng thái đang học? Ngày nghỉ học đã ghi trước đó sẽ bị xoá.
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
    </>
  );
}
