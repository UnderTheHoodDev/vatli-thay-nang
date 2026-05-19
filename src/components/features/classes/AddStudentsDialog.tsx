'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
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
import { ActionButton } from '@/components/ui/custom';
import { listUsers } from '@/actions/v1/users/list-users';
import { addStudentsAction } from '@/actions/v1/classes/add-students';
import { handleActionResult } from '@/lib/actions';
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
        <Button>
          <Plus /> Thêm học sinh
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
          <DialogDescription>
            Chọn học sinh muốn thêm vào lớp. Nếu học sinh đã có trong lớp, hệ thống sẽ báo lỗi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
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
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              <Search /> Tìm
            </Button>
          </div>
        </form>

        <div className="border-divider max-h-80 min-h-40 overflow-y-auto rounded-lg border">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Đang tải...</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">Không tìm thấy học sinh</div>
          ) : (
            <ul className="divide-divider divide-y">
              {rows.map((u) => {
                const isChecked = selected.has(u.id);
                return (
                  <li key={u.id}>
                    <label className="hover:bg-muted/40 flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(u.id)}
                        className="size-4 accent-purple"
                      />
                      <span className="flex-1 truncate">
                        <span className="font-medium">{u.fullName ?? '-'}</span>
                        <span className="ml-2 text-gray-500">{u.email}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Đã chọn {selected.size} học sinh</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">
              Trang {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Huỷ
          </Button>
          <ActionButton
            type="button"
            onClick={submit}
            disabled={selected.size === 0}
            isLoading={submitting}
            loadingText="Đang thêm..."
          >
            Thêm {selected.size > 0 ? `(${selected.size})` : ''}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
