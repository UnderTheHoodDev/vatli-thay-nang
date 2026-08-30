'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Save, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionButton } from '@/components/ui/custom';
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import ClassGroupBadge from './ClassGroupBadge';
import { listClassStudents } from '@/actions/v1/classes/list-class-students';
import { assignClassGroupAction } from '@/actions/v1/classes/assign-class-group';
import { handleActionResult } from '@/lib/actions';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ClassGroupRow, ClassStudentListRow } from '@/types/actions/class-management';

const DEFAULT_PAGE_SIZE = 10;

interface Props {
  classId: number;
  group: ClassGroupRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddStudentsToGroupModal({ classId, group, open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [rows, setRows] = useState<ClassStudentListRow[]>([]);
  const [total, setTotal] = useState(0);
  // Học sinh đang ở nhóm này lúc mở modal — tick sẵn; bỏ tick = bỏ khỏi nhóm khi lưu.
  const [initialMemberIds, setInitialMemberIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, startListTransition] = useTransition();
  const [submitting, startSubmitTransition] = useTransition();

  // rows đổi (trang mới / tìm kiếm mới) -> ghi nhận thành viên hiện có của nhóm
  // lần đầu thấy họ (tick sẵn), theo đúng cách "adjust state trong render".
  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    const newMembers = rows
      .filter((s) => s.classGroup?.id === group.id && !initialMemberIds.has(s.studentId))
      .map((s) => s.studentId);
    if (newMembers.length > 0) {
      setInitialMemberIds((prev) => new Set([...prev, ...newMembers]));
      setSelected((prev) => new Set([...prev, ...newMembers]));
    }
  }

  const reqIdRef = useRef(0);
  const fetchPage = useCallback(
    (nextPage: number, q: string, size: number) => {
      const reqId = ++reqIdRef.current;
      startListTransition(async () => {
        const res = await listClassStudents(classId, {
          q: q || undefined,
          status: 'STUDYING',
          page: nextPage,
          pageSize: size,
        });
        if (reqId !== reqIdRef.current) return;
        setRows(res.data);
        setTotal(res.meta.total);
      });
    },
    [classId],
  );

  useEffect(() => {
    if (!open) return;
    fetchPage(page, filter, pageSize);
  }, [open, page, filter, pageSize, fetchPage]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      reqIdRef.current += 1;
      setQuery('');
      setFilter('');
      setPage(1);
      setPageSize(DEFAULT_PAGE_SIZE);
      setRows([]);
      setTotal(0);
      setInitialMemberIds(new Set());
      setSelected(new Set());
    }
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilter(query.trim());
    setPage(1);
  }

  function handlePageSizeChange(v: string) {
    setPageSize(Number(v));
    setPage(1);
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const pageIds = rows.map((s) => s.studentId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  const setSelectAllRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (node) node.indeterminate = someOnPageSelected && !allOnPageSelected;
    },
    [someOnPageSelected, allOnPageSelected],
  );

  function toggleSelectAllPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  const toAssign = [...selected].filter((id) => !initialMemberIds.has(id));
  const toUnassign = [...initialMemberIds].filter((id) => !selected.has(id));
  const changeCount = toAssign.length + toUnassign.length;

  function submit() {
    if (changeCount === 0) return;
    startSubmitTransition(async () => {
      const calls = [];
      if (toAssign.length > 0) {
        calls.push(
          assignClassGroupAction(classId, { studentIds: toAssign, classGroupId: group.id }),
        );
      }
      if (toUnassign.length > 0) {
        calls.push(assignClassGroupAction(classId, { studentIds: toUnassign, classGroupId: null }));
      }
      const results = await Promise.all(calls);
      const errors = results.flatMap((r) => r.errors);
      const message =
        toAssign.length > 0 && toUnassign.length > 0
          ? `Đã thêm ${toAssign.length}, bỏ ${toUnassign.length} học sinh khỏi nhóm`
          : toAssign.length > 0
            ? `Đã thêm ${toAssign.length} học sinh vào nhóm`
            : `Đã bỏ ${toUnassign.length} học sinh khỏi nhóm`;
      const ok = handleActionResult(errors, undefined, message);
      if (ok) handleOpenChange(false);
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Quản lý học sinh nhóm &quot;{group.name}&quot;</DialogTitle>
          <DialogDescription>
            Tích để thêm vào nhóm, bỏ tích để đưa về &quot;Chưa phân nhóm&quot;. Một học sinh chỉ ở
            được 1 nhóm trong lớp — tích học sinh đang ở nhóm khác sẽ chuyển họ sang nhóm này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitSearch} className="flex gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo email hoặc họ tên…"
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="cursor-pointer">
            <Search /> Tìm
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {total === 0 ? 'Không có học sinh' : `Tìm thấy ${total} học sinh`}
            </span>
            {rows.length > 0 && (
              <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                <input
                  ref={setSelectAllRef}
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAllPage}
                  className="accent-primary size-4 cursor-pointer"
                  aria-label="Chọn tất cả học sinh trong trang"
                />
                <span className="text-foreground font-medium">Chọn tất cả trong trang</span>
              </label>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-sm">Hiển thị</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-20 cursor-pointer">
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
          <Badge variant={selected.size > 0 ? 'default' : 'secondary'}>
            Đã chọn {selected.size} học sinh
          </Badge>
        </div>

        <div className="border-divider bg-background max-h-96 min-h-56 [scrollbar-width:none] overflow-y-auto rounded-lg border [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <ul className="divide-divider divide-y">
              {Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <Skeleton className="size-4 shrink-0 rounded" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </li>
              ))}
            </ul>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Không tìm thấy học sinh"
              description="Thử thay đổi từ khoá tìm kiếm."
              className="py-6"
            />
          ) : (
            <ul className="divide-divider divide-y">
              {rows.map((s) => {
                const isChecked = selected.has(s.studentId);
                const wasOriginalMember = initialMemberIds.has(s.studentId);
                return (
                  <li key={s.studentId}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        isChecked ? 'bg-primary/5' : 'hover:bg-muted',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(s.studentId)}
                        className="accent-primary size-4 cursor-pointer"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="text-foreground font-medium">{s.fullName ?? '—'}</span>
                        <span className="text-muted-foreground ml-2">{s.email}</span>
                      </span>
                      {!wasOriginalMember && (
                        <ClassGroupBadge group={s.classGroup} className="shrink-0" />
                      )}
                      {wasOriginalMember && !isChecked && (
                        <span className="text-destructive shrink-0 text-xs italic">
                          Sẽ bỏ khỏi nhóm
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center sm:justify-end">
            <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="cursor-pointer"
          >
            Huỷ
          </Button>
          <ActionButton
            type="button"
            onClick={submit}
            disabled={changeCount === 0}
            isLoading={submitting}
            loadingText="Đang lưu..."
            className="cursor-pointer"
          >
            <Save /> Lưu thay đổi {changeCount > 0 ? `(${changeCount})` : ''}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
