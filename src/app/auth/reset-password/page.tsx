import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readPasswordReset } from '@/actions/v1/auth/read-password-reset';
import AuthSplitLayout from '@/components/features/auth/AuthSplitLayout';
import ResetPasswordForm from '@/components/features/auth/ResetPasswordForm';

interface Props {
  searchParams: Promise<{ tk?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { tk } = await searchParams;
  if (!tk) redirect('/auth/forgot-password');

  const payload = await readPasswordReset(tk);

  if (!payload) {
    return (
      <AuthSplitLayout>
        <div className="space-y-4 text-center">
          <h1 className="font-paytone text-purple text-2xl">Link không hợp lệ</h1>
          <p className="text-sm text-gray-500">
            Link đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu link mới.
          </p>
          <Link href="/auth/forgot-password" className="text-purple text-sm hover:underline">
            Gửi lại link đặt lại mật khẩu
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <ResetPasswordForm token={tk} email={payload.email} />
    </AuthSplitLayout>
  );
}
