import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="font-opensans bg-light-bg flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-paytone text-purple text-5xl">404</h1>
      <p className="text-dark text-base">Trang bạn tìm không tồn tại.</p>
      <Button asChild>
        <Link href="/">Quay về trang chủ</Link>
      </Button>
    </div>
  );
}
