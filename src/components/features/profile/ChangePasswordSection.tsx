'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButton, FormTextField, PasswordFields } from '@/components/ui/custom';
import { handleActionResult } from '@/lib/actions';
import { PASSWORD_REGEX, VALIDATION_MESSAGES } from '@/lib/validation';
import { changePasswordAction } from '@/actions/v1/auth/change-password';
import type { Role } from '@/types/auth';

interface Props {
  role: Role;
}

export default function ChangePasswordSection({ role }: Props) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword) {
      toast.error(VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED);
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      toast.error(VALIDATION_MESSAGES.PASSWORD_INVALID);
      return;
    }
    if (password === currentPassword) {
      toast.error(VALIDATION_MESSAGES.PASSWORD_SAME_AS_CURRENT);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(VALIDATION_MESSAGES.PASSWORD_MISMATCH);
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        password,
        confirmPassword,
        isInitialSetup: false,
        role,
      });
      const ok = handleActionResult(result.errors, () => {
        if (result.redirectTo) router.push(result.redirectTo);
      });
      if (ok) {
        toast.success('Đổi mật khẩu thành công');
        setCurrentPassword('');
        setPassword('');
        setConfirmPassword('');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi mật khẩu</CardTitle>
        <p className="text-muted-foreground text-sm">
          Mật khẩu cần có ít nhất 1 chữ hoa, 1 số, độ dài tối thiểu 8 ký tự.
        </p>
      </CardHeader>
      <CardContent className="pb-6">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:max-w-md">
          <FormTextField
            id="oldPassword"
            label="Mật khẩu hiện tại"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
            disabled={pending}
          />
          <PasswordFields
            password={password}
            confirmPassword={confirmPassword}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            disabled={pending}
            showConfirmLabel="Xác nhận mật khẩu mới"
          />
          <div className="pt-2">
            <ActionButton
              type="submit"
              isLoading={pending}
              loadingText="Đang cập nhật..."
              className="cursor-pointer"
            >
              <KeyRound /> Đổi mật khẩu
            </ActionButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
