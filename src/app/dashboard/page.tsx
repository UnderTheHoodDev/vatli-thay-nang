import { getCurrentSession } from '@/lib/server/session';

export default async function DashboardPage() {
  const session = await getCurrentSession();

  return (
    <div className="space-y-4">
      <h1 className="font-paytone text-purple text-2xl">Xin chào!</h1>
      <p className="text-gray-600">
        Bạn đã đăng nhập với email <span className="font-medium">{session?.email}</span>
        {session?.role === 'ADMIN' && (
          <>
            {' '}
            (Admin) —{' '}
            <a className="text-purple underline" href="/admin/users">
              Vào trang quản trị
            </a>
          </>
        )}
      </p>
      <div className="border-divider rounded-lg border bg-white p-6">
        <p className="text-sm text-gray-500">
          Đây là trang dashboard cơ bản cho học sinh. Nội dung sẽ được mở rộng ở các giai đoạn sau.
        </p>
      </div>
    </div>
  );
}
