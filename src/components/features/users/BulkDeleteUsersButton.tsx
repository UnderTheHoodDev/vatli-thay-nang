'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { bulkDeleteUsersAction } from '@/actions/v1/users/bulk-delete-users';

interface Props {
  selectedIds: number[];
  onDone: () => void;
}

export default function BulkDeleteUsersButton({ selectedIds, onDone }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const res = await bulkDeleteUsersAction(selectedIds);
      if (res.errors.length) {
        res.errors.forEach((e) => toast.error(e));
        return;
      }

      const { deleted, skipped } = res.data ?? { deleted: 0, skipped: [] };
      if (deleted > 0) {
        toast.success(`Đã xoá ${deleted} tài khoản`);
      }
      if (skipped.length > 0) {
        const notFoundCount = skipped.filter((s) => s.reason === 'notFound').length;
        const selfDeleteCount = skipped.filter((s) => s.reason === 'selfDelete').length;
        const protectedRoleCount = skipped.filter((s) => s.reason === 'protectedRole').length;
        const parts: string[] = [];
        if (notFoundCount) parts.push(`${notFoundCount} không còn tồn tại`);
        if (selfDeleteCount) parts.push(`${selfDeleteCount} là tài khoản đang thao tác`);
        if (protectedRoleCount) parts.push(`${protectedRoleCount} không phải học sinh`);
        toast.error(`Bỏ qua ${skipped.length} tài khoản (${parts.join(', ')})`);
      }

      setOpen(false);
      onDone();
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <Button
        variant="destructive"
        className="cursor-pointer"
        disabled={selectedIds.length === 0}
        onClick={() => setOpen(true)}
      >
        <Trash2 /> Xoá đã chọn ({selectedIds.length})
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá {selectedIds.length} tài khoản đã chọn?</AlertDialogTitle>
          <AlertDialogDescription>
            Các tài khoản học sinh được chọn cùng toàn bộ dữ liệu liên quan sẽ bị xoá vĩnh viễn. Tài
            khoản không phải học sinh, tài khoản đang thao tác hoặc không còn tồn tại sẽ bị bỏ qua.
            Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="cursor-pointer">
            Huỷ
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              confirmDelete();
            }}
          >
            {pending ? 'Đang xoá...' : 'Xoá đã chọn'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
