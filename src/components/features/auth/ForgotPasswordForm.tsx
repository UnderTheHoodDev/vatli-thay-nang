'use client';

import { FormEvent, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { forgotPasswordAction } from '@/actions/v1/auth/forgot-password';
import { EMAIL_REGEX, VALIDATION_MESSAGES } from '@/lib/validation';
import { ActionButton, FormTextField } from '@/components/ui/custom';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const trimmedEmail = email.trim();

  function send() {
    startTransition(async () => {
      const result = await forgotPasswordAction(trimmedEmail);
      setError(result.errors.length ? result.errors.join(' ') : undefined);
      if (!result.errors.length) setSent(true);
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!trimmedEmail) {
      setError(VALIDATION_MESSAGES.EMAIL_REQUIRED);
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(VALIDATION_MESSAGES.EMAIL_INVALID);
      return;
    }
    setError(undefined);
    send();
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <MailCheck className="text-purple size-10" />
          <h1 className="font-paytone text-purple text-2xl">Gửi mail thành công</h1>
          <p className="text-sm text-gray-500">
            Nếu <span className="text-foreground font-medium">{trimmedEmail}</span> là email của
            một tài khoản đã kích hoạt, chúng tôi đã gửi tới đó một link đặt lại mật khẩu. Link có
            hiệu lực trong vòng 1 ngày.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Không nhận được mail? Kiểm tra hộp thư rác, hoặc gửi lại (tối đa 5 lần mỗi ngày).
          </p>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <ActionButton
            type="button"
            variant="outline"
            className="w-full"
            isLoading={pending}
            loadingText="Đang gửi lại..."
            onClick={send}
          >
            Gửi lại email
          </ActionButton>
        </div>

        <Link
          href="/auth/login"
          className="text-purple inline-flex items-center gap-1.5 text-sm hover:underline"
        >
          <ArrowLeft className="size-4" /> Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="font-paytone text-purple text-2xl">Quên mật khẩu</h1>
        <p className="text-sm text-gray-500">
          Nhập email của tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu tới hộp thư của bạn.
        </p>
      </div>
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormTextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setError(undefined);
          }}
          placeholder="ban@vltn.vn"
          required
          disabled={pending}
          error={error}
        />
        <ActionButton
          type="submit"
          className="w-full"
          size="lg"
          isLoading={pending}
          loadingText="Đang gửi..."
        >
          Gửi link đặt lại mật khẩu
        </ActionButton>
      </form>
      <Link
        href="/auth/login"
        className="text-purple inline-flex items-center gap-1.5 text-sm hover:underline"
      >
        <ArrowLeft className="size-4" /> Quay lại đăng nhập
      </Link>
    </div>
  );
}
