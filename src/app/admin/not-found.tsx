import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
            <Compass className="size-7" />
          </span>
          <div className="space-y-1.5">
            <p className="text-primary font-paytone text-5xl tracking-tight">404</p>
            <h1 className="text-foreground text-lg font-semibold">Trang admin không tồn tại</h1>
            <p className="text-muted-foreground text-sm">
              Đường dẫn bạn vừa truy cập không có sẵn hoặc đã được di chuyển.
            </p>
          </div>
          <Button asChild variant="outline" className="cursor-pointer">
            <Link href="/admin/accounts">
              <ArrowLeft /> Quay lại danh sách người dùng
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
