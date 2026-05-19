'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { changePasswordAction } from '@/actions/v1/auth/change-password';
import { PASSWORD_REGEX, VALIDATION_MESSAGES } from '@/lib/validation';
import { handleActionResult } from '@/lib/actions';
import { PasswordFields, ActionButton } from '@/components/ui/custom';
import type { Role } from '@/types/auth';

interface Props {
  role: Role;
}

export default function ChangePasswordForm({ role }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, startTransition] = useTransition();

  function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!PASSWORD_REGEX.test(password)) {
      toast.error(VALIDATION_MESSAGES.PASSWORD_INVALID);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(VALIDATION_MESSAGES.PASSWORD_MISMATCH);
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword: undefined,
        password,
        confirmPassword,
        isInitialSetup: true,
        role,
      });
      const succeeded = handleActionResult(result.errors, () => {
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      });
      if (succeeded) {
        toast.success('Đặt mật khẩu thành công');
      }
    });
  }

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-paytone text-purple text-2xl">Đặt mật khẩu</h1>
        <p className="text-sm text-gray-500">
          Mật khẩu cần có ít nhất 1 chữ hoa, 1 số, độ dài tối thiểu 8 ký tự.
        </p>
      </div>
      <PasswordFields
        password={password}
        confirmPassword={confirmPassword}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        disabled={pending}
        showConfirmLabel="Xác nhận mật khẩu"
      />
      <ActionButton
        type="submit"
        className="w-full"
        isLoading={pending}
        loadingText="Đang đặt mật khẩu..."
      >
        Đặt mật khẩu
      </ActionButton>
    </form>
  );
}
