'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
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
import { resetUserPasswordAction } from '@/actions/v1/users/reset-user-password';

interface Props {
  userId: number;
  email: string;
}

export default function ResetUserPasswordButton({ userId, email }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmReset() {
    startTransition(async () => {
      const res = await resetUserPasswordAction(userId);
      const ok = handleActionResult(res.errors, () => router.refresh(), 'Đã đặt lại mật khẩu');
      if (ok) setNewPassword(res.password ?? null);
    });
  }

  async function copyPassword() {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không sao chép được, vui lòng chọn và copy thủ công');
    }
  }

  function openDialog() {
    setNewPassword(null);
    setCopied(false);
    setOpen(true);
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (pending) return;
        if (o) openDialog();
        else setOpen(false);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="outline"
            className="cursor-pointer"
            aria-label="Đặt lại mật khẩu"
            onClick={openDialog}
          >
            <KeyRound />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Đặt lại mật khẩu</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        {newPassword ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Đã đặt lại mật khẩu cho {email}</AlertDialogTitle>
              <AlertDialogDescription>
                Gửi mật khẩu này cho học sinh và nhắc bạn ấy đổi lại ngay sau khi đăng nhập. Đóng
                hộp thoại rồi thì không xem lại được nữa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="bg-muted flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <code className="text-foreground font-mono text-sm break-all">{newPassword}</code>
              <Button
                size="icon-sm"
                variant="ghost"
                className="shrink-0 cursor-pointer"
                aria-label="Sao chép mật khẩu"
                onClick={copyPassword}
              >
                {copied ? <Check className="text-success" /> : <Copy />}
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction className="cursor-pointer" onClick={() => setOpen(false)}>
                Đóng
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Đặt lại mật khẩu cho {email}?</AlertDialogTitle>
              <AlertDialogDescription>
                Mật khẩu hiện tại sẽ bị thay bằng mật khẩu mặc định. Học sinh bị đăng xuất khỏi mọi
                thiết bị, và link &quot;quên mật khẩu&quot; đang chờ trong hộp thư (nếu có) sẽ hết
                hiệu lực.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending} className="cursor-pointer">
                Huỷ
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  confirmReset();
                }}
              >
                {pending ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
