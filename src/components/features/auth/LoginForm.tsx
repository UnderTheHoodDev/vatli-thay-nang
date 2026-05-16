'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loginAction } from '@/actions/v1/auth/login';
import { EMAIL_REGEX, VALIDATION_MESSAGES } from '@/lib/validation';
import { handleActionResult } from '@/lib/actions';
import { FormTextField, ActionButton } from '@/components/ui/custom';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, startTransition] = useTransition();

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error(VALIDATION_MESSAGES.EMAIL_PASSWORD_REQUIRED);
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error(VALIDATION_MESSAGES.EMAIL_INVALID);
      return;
    }

    startTransition(async () => {
      try {
        const result = await loginAction(trimmedEmail, password);
        const succeeded = handleActionResult(result.errors, () => {
          if (result.redirectTo) {
            router.push(result.redirectTo);
          }
        });
        if (succeeded) {
          toast.success('Đăng nhập thành công');
        }
      } finally {
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-paytone text-purple text-2xl">Đăng nhập</h1>
        <p className="text-sm text-gray-500">Vui lòng nhập email và mật khẩu để đăng nhập.</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <FormTextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
          disabled={pending}
        />
        <FormTextField
          id="password"
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={setPassword}
          required
          disabled={pending}
        />
        <ActionButton
          type="submit"
          className="w-full"
          isLoading={pending}
          loadingText="Đang đăng nhập..."
        >
          Đăng nhập
        </ActionButton>
      </form>
    </div>
  );
}
