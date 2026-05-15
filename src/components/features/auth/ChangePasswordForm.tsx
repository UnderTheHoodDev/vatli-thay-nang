'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { changePasswordAction } from '@/actions/v1/auth/change-password';
import { PASSWORD_REGEX, VALIDATION_MESSAGES } from '@/lib/validation';
import { handleActionResult } from '@/lib/actions';
import { PasswordFields, ActionButton, FormTextField } from '@/components/ui/custom';
import type { Role } from '@/types/auth';

interface Props {
  isInitialSetup: boolean;
  role: Role;
}

export default function ChangePasswordForm({ isInitialSetup, role }: Props) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, startTransition] = useTransition();

  function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isInitialSetup && !currentPassword) {
      toast.error(VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED);
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      toast.error(VALIDATION_MESSAGES.PASSWORD_INVALID);
      return;
    }
    if (!isInitialSetup && password === currentPassword) {
      toast.error(VALIDATION_MESSAGES.PASSWORD_SAME_AS_CURRENT);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(VALIDATION_MESSAGES.PASSWORD_MISMATCH);
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword: isInitialSetup ? undefined : currentPassword,
        password,
        confirmPassword,
        isInitialSetup,
        role,
      });
      const succeeded = handleActionResult(result.errors, () => {
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      });
      if (succeeded) {
        toast.success(
          isInitialSetup ? 'Đặt mật khẩu thành công' : 'Đổi mật khẩu thành công',
        );
      }
    });
  }

  const title = isInitialSetup ? 'Đặt mật khẩu' : 'Đổi mật khẩu';

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-paytone text-purple text-2xl">{title}</h1>
        <p className="text-sm text-gray-500">
          Mật khẩu cần có ít nhất 1 chữ hoa, 1 số, độ dài tối thiểu 8 ký tự.
        </p>
      </div>
      {!isInitialSetup && (
        <FormTextField
          id="currentPassword"
          label="Mật khẩu hiện tại"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
          required
          disabled={pending}
        />
      )}
      <PasswordFields
        password={password}
        confirmPassword={confirmPassword}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        disabled={pending}
        showConfirmLabel={isInitialSetup ? 'Xác nhận mật khẩu' : 'Xác nhận mật khẩu mới'}
      />
      <ActionButton
        type="submit"
        className="w-full"
        isLoading={pending}
        loadingText={isInitialSetup ? 'Đang đặt mật khẩu...' : 'Đang cập nhật...'}
      >
        {isInitialSetup ? 'Đặt mật khẩu' : 'Cập nhật'}
      </ActionButton>
    </form>
  );
}
