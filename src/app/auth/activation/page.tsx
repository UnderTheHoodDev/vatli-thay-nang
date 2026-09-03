import { redirect } from 'next/navigation';
import { readActivation } from '@/actions/v1/auth/read-activation';
import { getCurrentSession } from '@/lib/server/session';
import AuthSplitLayout from '@/components/features/auth/AuthSplitLayout';
import ActivationForm from '@/components/features/auth/ActivationForm';

interface Props {
  searchParams: Promise<{ tk?: string }>;
}

export default async function ActivationPage({ searchParams }: Props) {
  const { tk } = await searchParams;
  if (!tk) redirect('/auth/login');

  const payload = await readActivation(tk);

  if (!payload) {
    // Token đã bị dùng hoặc hết hạn — nhưng nếu trình duyệt này vẫn còn giữ
    // session từ lần bấm "Kích hoạt tài khoản" trước đó (ví dụ mạng nghẽn làm
    // rớt trang ngay sau khi xác thực token, trước khi kịp đặt mật khẩu) thì
    // đừng chặn họ lại ở đây — đưa thẳng về trang đặt mật khẩu để đi tiếp,
    // không cần phải nhờ admin gửi lại link.
    const session = await getCurrentSession();
    if (session && !session.hasPassword) {
      redirect('/auth/change-password');
    }

    return (
      <AuthSplitLayout>
        <div className="space-y-4 text-center">
          <h1 className="font-paytone text-purple text-2xl">Token không hợp lệ</h1>
          <p className="text-sm text-gray-500">
            Đường dẫn kích hoạt đã hết hạn hoặc không tồn tại. Vui lòng liên hệ quản trị viên để
            được gửi lại.
          </p>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <ActivationForm token={tk} email={payload.email} />
    </AuthSplitLayout>
  );
}
