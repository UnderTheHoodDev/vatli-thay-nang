'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { handleActionResult } from '@/lib/actions';
import { ActionButton } from '@/components/ui/custom';
import { confirmActivationAction } from '@/actions/v1/auth/confirm-activation';

interface Props {
  token: string;
  email: string;
}

export default function ActivationForm({ token, email }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleActivation() {
    startTransition(async () => {
      const result = await confirmActivationAction(token);
      const succeeded = handleActionResult(result.errors, () => {
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      });
      if (succeeded) {
        toast.success('Kích hoạt tài khoản thành công. Vui lòng đặt mật khẩu.');
      }
    });
  }

  return (
    <div className="space-y-4 text-center">
      <h1 className="font-paytone text-purple text-2xl">Kích hoạt tài khoản</h1>
      <p className="text-sm text-gray-600">
        Tài khoản <span className="font-medium">{email}</span> đã sẵn sàng. Ấn nút bên dưới để kích
        hoạt, sau đó bạn sẽ được chuyển sang trang đặt mật khẩu.
      </p>
      <ActionButton
        type="button"
        className="w-full"
        onClick={handleActivation}
        isLoading={pending}
        loadingText="Đang kích hoạt..."
      >
        Kích hoạt tài khoản
      </ActionButton>
    </div>
  );
}
