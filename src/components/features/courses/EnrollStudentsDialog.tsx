'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Plus, Search, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionButton } from '@/components/ui/custom';
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import { listUsers } from '@/actions/v1/users/list-users';
import { addCourseEnrollmentsAction } from '@/actions/v1/courses/add-course-enrollments';
import { handleActionResult } from '@/lib/actions';
import { cn } from '@/lib/utils';
import type { UserRow } from '@/types/auth';

const MODAL_PAGE_SIZE = 10;

interface Props {
  courseId: number;
}

export default function EnrollStudentsDialog({ courseId }: Props) {
  const [open, setOpen] = useState(false);
  const [emailQuery, setEmailQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, startListTransition] = useTransition();
  const [submitting, startSubmitTransition] = useTransition();

  // Monotonic request id: rapid page/search changes fire overlapping listUsers
  // calls (useTransition doesn't cancel them). Ignore any response that isn't the
  // latest, so a slow earlier page can't overwrite the rows of a newer one.
  const reqIdRef = useRef(0);
  const fetchPage = useCallback(
    (nextPage: number, email: string, fullName: string) => {
      const reqId = ++reqIdRef.current;
      startListTransition(async () => {
        const res = await listUsers({
          role: 'STUDENT',
          notInCourseId: courseId,
          email: email || undefined,
          fullName: fullName || undefined,
          page: nextPage,
          pageSize: MODAL_PAGE_SIZE,
        });
        if (reqId !== reqIdRef.current) return;
        setRows(res.data);
        setTotal(res.meta.total);
      });
    },
    [courseId],
  );

  useEffect(() => {
    if (!open) return;
    fetchPage(page, emailFilter, nameFilter);
  }, [open, page, emailFilter, nameFilter, fetchPage]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Invalidate any in-flight fetch so a late response can't repopulate the
      // just-cleared rows/total after the dialog closes (would flash on reopen).
      reqIdRef.current += 1;
      setEmailQuery('');
      setNameQuery('');
      setEmailFilter('');
      setNameFilter('');
      setPage(1);
      setRows([]);
      setTotal(0);
      setSelected(new Set());
    }
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setEmailFilter(emailQuery.trim());
    setNameFilter(nameQuery.trim());
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

  const pageIds = rows.map((u) => u.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  // Callback ref (not a deps-gated effect): the header checkbox unmounts while a
  // page is loading and remounts with indeterminate=false. A callback ref re-runs
  // on remount and whenever these booleans change, so the dashed state never goes stale.
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

  function clearAll() {
    setSelected(new Set());
  }

  function submit() {
    if (selected.size === 0) return;
    const ids = [...selected];
    startSubmitTransition(async () => {
      const res = await addCourseEnrollmentsAction(courseId, { studentIds: ids });
      const ok = handleActionResult(res.errors, undefined, `Đã ghi danh ${ids.length} học sinh`);
      if (ok) handleOpenChange(false);
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / MODAL_PAGE_SIZE));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus /> Thêm học sinh
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Ghi danh học sinh vào khóa học</DialogTitle>
          <DialogDescription>
            Chọn học sinh để ghi danh vào khóa học này. Học sinh đã ghi danh hoặc bị vô hiệu hóa sẽ
            không hiển thị.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submitSearch}
          className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="enroll-email">Email</Label>
            <Input
              id="enroll-email"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              placeholder="example@vltn.vn"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="enroll-name">Họ và tên</Label>
            <Input
              id="enroll-name"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full cursor-pointer sm:w-auto">
              <Search /> Tìm
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">
            {total === 0 ? 'Không có học sinh' : `Tìm thấy ${total} học sinh`}
          </span>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground cursor-pointer text-xs underline"
              >
                Bỏ chọn tất cả
              </button>
            )}
            <Badge variant={selected.size > 0 ? 'default' : 'secondary'}>
              Đã chọn {selected.size} học sinh
            </Badge>
          </div>
        </div>

        <div className="border-divider bg-background max-h-96 min-h-56 [scrollbar-width:none] overflow-y-auto rounded-lg border [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <ul className="divide-divider divide-y">
              {Array.from({ length: MODAL_PAGE_SIZE }).map((_, i) => (
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
            <>
              <label className="bg-muted/40 border-divider sticky top-0 z-10 flex cursor-pointer items-center gap-3 border-b px-4 py-2.5">
                <input
                  ref={setSelectAllRef}
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAllPage}
                  className="accent-primary size-4 cursor-pointer"
                  aria-label="Chọn tất cả học sinh trong trang"
                />
                <span className="text-foreground text-sm font-medium">Chọn tất cả trong trang</span>
              </label>
              <ul className="divide-divider divide-y">
                {rows.map((u) => {
                  const isChecked = selected.has(u.id);
                  return (
                    <li key={u.id}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                          isChecked ? 'bg-primary/5' : 'hover:bg-muted',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(u.id)}
                          className="accent-primary size-4 cursor-pointer"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          <span className="text-foreground font-medium">{u.fullName ?? '—'}</span>
                          <span className="text-muted-foreground ml-2">{u.email}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
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
            disabled={selected.size === 0}
            isLoading={submitting}
            loadingText="Đang ghi danh..."
            className="cursor-pointer"
          >
            <UserPlus /> Ghi danh {selected.size > 0 ? `(${selected.size})` : ''}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
