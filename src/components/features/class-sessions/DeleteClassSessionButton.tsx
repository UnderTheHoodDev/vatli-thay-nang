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
import { deleteClassSessionAction } from '@/actions/v1/class-sessions/delete-class-session';

interface Props {
  sessionId: number;
  classId: number;
  title: string;
}

export default function DeleteClassSessionButton({ sessionId, classId, title }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteClassSessionAction(sessionId, classId);
      const ok = handleActionResult(res.errors, () => router.refresh(), 'Xoá buổi học thành công');
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
            aria-label="Xoá buổi học"
            onClick={() => setOpen(true)}
          >
            <Trash2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Xoá buổi học</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá buổi học &quot;{title}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Toàn bộ lịch sử điểm danh và đơn xin nghỉ của buổi học này sẽ bị xoá vĩnh viễn. Hành
            động này không thể hoàn tác.
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
            {pending ? 'Đang xoá...' : 'Xoá buổi học'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
