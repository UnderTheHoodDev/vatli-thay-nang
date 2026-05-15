import { redirect } from 'next/navigation';
import { readActivation } from '@/actions/v1/auth/read-activation';
import ActivationForm from '@/components/features/auth/ActivationForm';

interface Props {
  searchParams: Promise<{ tk?: string }>;
}

export default async function ActivationPage({ searchParams }: Props) {
  const { tk } = await searchParams;
  if (!tk) redirect('/auth/login');

  const payload = await readActivation(tk);

  if (!payload) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-paytone text-purple text-2xl">Token không hợp lệ</h1>
        <p className="text-sm text-gray-500">
          Đường dẫn kích hoạt đã hết hạn hoặc không tồn tại. Vui lòng liên hệ quản trị viên để được
          gửi lại.
        </p>
      </div>
    );
  }

  return <ActivationForm token={tk} email={payload.email} />;
}
