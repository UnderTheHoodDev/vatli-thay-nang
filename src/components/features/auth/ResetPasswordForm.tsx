'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { resetPasswordAction } from '@/actions/v1/auth/reset-password';
import { validateNewPassword } from '@/lib/validation';
import { handleActionResult } from '@/lib/actions';
import { ActionButton, PasswordFields } from '@/components/ui/custom';

interface Props {
  token: string;
  email: string;
}

export default function ResetPasswordForm({ token, email }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const invalid = validateNewPassword(password, confirmPassword);
    if (invalid) {
      toast.error(invalid);
      return;
    }

    startTransition(async () => {
      const result = await resetPasswordAction(token, password, confirmPassword);
      handleActionResult(
        result.errors,
        () => {
          if (result.redirectTo) router.replace(result.redirectTo);
        },
        'Đặt lại mật khẩu thành công',
      );
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1.5">
        <h1 className="font-paytone text-purple text-2xl">Đặt lại mật khẩu</h1>
        <p className="text-sm text-gray-500">
          Đặt mật khẩu mới cho <span className="text-foreground font-medium">{email}</span>. Mật
          khẩu cần có ít nhất 1 chữ hoa, 1 số, độ dài tối thiểu 8 ký tự.
        </p>
      </div>
      <PasswordFields
        password={password}
        confirmPassword={confirmPassword}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        disabled={pending}
        showConfirmLabel="Xác nhận mật khẩu mới"
      />
      <ActionButton
        type="submit"
        className="w-full"
        size="lg"
        isLoading={pending}
        loadingText="Đang đặt lại..."
      >
        Đặt lại mật khẩu
      </ActionButton>
    </form>
  );
}
