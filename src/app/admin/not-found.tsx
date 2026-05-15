import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="font-paytone text-purple text-4xl">404</h1>
      <p className="text-sm text-gray-500">Trang admin này không tồn tại.</p>
      <Button asChild variant="outline">
        <Link href="/admin/users">Quay lại danh sách user</Link>
      </Button>
    </div>
  );
}
