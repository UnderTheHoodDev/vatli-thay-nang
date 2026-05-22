'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
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
import { ActionButton } from '@/components/ui/custom';
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import { listUsers } from '@/actions/v1/users/list-users';
import { addStudentsAction } from '@/actions/v1/classes/add-students';
import { handleActionResult } from '@/lib/actions';
import { cn } from '@/lib/utils';
import type { UserRow } from '@/types/auth';

const MODAL_PAGE_SIZE = 10;

interface Props {
  classId: number;
}

export default function AddStudentsDialog({ classId }: Props) {
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

  const fetchPage = useCallback(
    (nextPage: number, email: string, fullName: string) => {
      startListTransition(async () => {
        const res = await listUsers({
          role: 'STUDENT',
          notInClassId: classId,
          email: email || undefined,
          fullName: fullName || undefined,
          page: nextPage,
          pageSize: MODAL_PAGE_SIZE,
        });
        setRows(res.data);
        setTotal(res.meta.total);
      });
    },
    [classId],
  );

  useEffect(() => {
    if (!open) return;
    fetchPage(page, emailFilter, nameFilter);
  }, [open, page, emailFilter, nameFilter, fetchPage]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
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

  function submit() {
    if (selected.size === 0) return;
    const ids = [...selected];
    startSubmitTransition(async () => {
      const res = await addStudentsAction(classId, ids);
      const ok = handleActionResult(res.errors, undefined, `Đã thêm ${ids.length} học sinh`);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
          <DialogDescription>
            Chọn học sinh muốn thêm vào lớp. Học sinh đã có trong lớp sẽ không hiển thị.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submitSearch}
          className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="add-student-email">Email</Label>
            <Input
              id="add-student-email"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              placeholder="example@vltn.vn"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-student-name">Họ và tên</Label>
            <Input
              id="add-student-name"
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

        <div className="border-divider bg-background max-h-80 min-h-44 overflow-y-auto rounded-lg border">
          {loading ? (
            <div className="text-muted-foreground py-8 text-center text-sm">Đang tải...</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Không tìm thấy học sinh phù hợp"
              description="Thử thay đổi từ khoá tìm kiếm."
              className="py-6"
            />
          ) : (
            <ul className="divide-divider divide-y">
              {rows.map((u) => {
                const isChecked = selected.has(u.id);
                return (
                  <li key={u.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        isChecked ? 'bg-primary/5' : 'hover:bg-muted/60',
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
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-muted-foreground text-sm">
            {selected.size > 0 ? (
              <Badge variant="default">Đã chọn {selected.size}</Badge>
            ) : (
              <span>Chưa chọn học sinh nào</span>
            )}
          </div>
          {totalPages > 1 && (
            <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>

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
            loadingText="Đang thêm..."
            className="cursor-pointer"
          >
            <UserPlus /> Thêm {selected.size > 0 ? `(${selected.size})` : ''}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
