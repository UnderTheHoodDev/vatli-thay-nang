import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <p className="text-purple text-6xl font-bold">404</p>
        <h1 className="font-paytone text-purple text-2xl">Trang không tồn tại</h1>
        <p className="text-sm text-gray-500">Đường dẫn bạn vừa truy cập không có sẵn.</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Quay về Dashboard</Link>
      </Button>
    </div>
  );
}
