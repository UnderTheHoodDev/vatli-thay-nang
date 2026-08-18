'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { loginAction } from '@/actions/v1/auth/login';
import { EMAIL_REGEX, VALIDATION_MESSAGES } from '@/lib/validation';
import { FormTextField, ActionButton } from '@/components/ui/custom';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [credentialsInvalid, setCredentialsInvalid] = useState(false);
  const [pending, startTransition] = useTransition();

  function clearFieldError(field: keyof FormErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (credentialsInvalid) setCredentialsInvalid(false);
  }

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const nextErrors: FormErrors = {};
    if (!trimmedEmail) {
      nextErrors.email = VALIDATION_MESSAGES.EMAIL_REQUIRED;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = VALIDATION_MESSAGES.EMAIL_INVALID;
    }
    if (!password) {
      nextErrors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    }
    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      setCredentialsInvalid(false);
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await loginAction(trimmedEmail, password);
      if (result.errors.length) {
        setErrors({ password: result.errors.join(' ') });
        setCredentialsInvalid(true);
        return;
      }
      setCredentialsInvalid(false);
      toast.success('Đăng nhập thành công');
      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <div className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="font-paytone text-purple text-2xl">Đăng nhập</h1>
        <p className="text-sm text-gray-500">Vui lòng nhập email và mật khẩu để đăng nhập.</p>
      </div>
      <form onSubmit={handleLogin} noValidate className="space-y-5">
        <FormTextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            clearFieldError('email');
          }}
          placeholder="ban@vltn.vn"
          required
          disabled={pending}
          error={errors.email}
          invalid={credentialsInvalid}
        />
        <FormTextField
          id="password"
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            clearFieldError('password');
          }}
          required
          disabled={pending}
          error={errors.password}
          invalid={credentialsInvalid}
        />
        <ActionButton
          type="submit"
          className="w-full"
          size="lg"
          isLoading={pending}
          loadingText="Đang đăng nhập..."
        >
          Đăng nhập
        </ActionButton>
      </form>
    </div>
  );
}
