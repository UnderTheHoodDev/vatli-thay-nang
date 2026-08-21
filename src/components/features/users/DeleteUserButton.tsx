'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { handleActionResult } from '@/lib/actions';
import { deleteUserAction } from '@/actions/v1/users/delete-user';

interface Props {
  userId: number;
  email: string;
}

export default function DeleteUserButton({ userId, email }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      const ok = handleActionResult(res.errors, () => router.refresh(), 'Đã xoá tài khoản');
      if (ok) setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="destructive"
            className="cursor-pointer"
            aria-label="Xoá tài khoản"
            onClick={() => setOpen(true)}
          >
            <Trash2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Xoá tài khoản</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá tài khoản {email}?</AlertDialogTitle>
          <AlertDialogDescription>
            Chỉ xoá được nếu tài khoản chưa có dữ liệu học tập/học phí/giảng dạy nào. Nếu đã có, hệ
            thống sẽ báo lỗi — hãy dùng &quot;Vô hiệu hoá&quot; thay vì xoá. Hành động này không thể
            hoàn tác.
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
            {pending ? 'Đang xoá...' : 'Xoá tài khoản'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
