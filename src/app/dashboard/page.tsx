import Link from 'next/link';
import { ArrowRight, GraduationCap, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/app/StatsCard';
import { listClasses } from '@/actions/v1/classes/list-classes';
import { getCurrentSession } from '@/lib/server/session';

export default async function DashboardPage() {
  const [session, activeClassesRes] = await Promise.all([
    getCurrentSession(),
    listClasses({ status: 'ACTIVE', page: 1, pageSize: 1 }),
  ]);
  const displayName = session?.fullName?.trim() || session?.email?.split('@')[0] || 'bạn';

  return (
    <div className="space-y-6">
      <Card className="from-primary to-primary/80 text-primary-foreground gap-2 border-0 bg-linear-to-br shadow-md">
        <CardContent className="flex flex-col gap-3 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="text-primary-foreground/80 inline-flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
              <Sparkles className="size-4" /> Vật Lí Thầy Năng
            </div>
            <h1 className="font-paytone text-2xl tracking-tight sm:text-3xl">
              Chào {displayName}!
            </h1>
            <p className="text-primary-foreground/85 max-w-xl text-sm">
              Sẵn sàng chinh phục những bài học mới hôm nay. Cùng kiểm tra lịch học và tiến độ của
              bạn nhé.
            </p>
          </div>
          <Button
            asChild
            variant="secondary"
            className="text-primary cursor-pointer self-start bg-white shadow-sm hover:bg-white/90 sm:self-center"
          >
            <Link href="/dashboard/profile">
              <UserRound /> Hồ sơ của tôi
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatsCard
          label="Lớp đang học"
          value={activeClassesRes.meta.total}
          icon={GraduationCap}
          tone="primary"
          hint="Số lớp bạn đang tham gia"
        />

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Truy cập nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-6">
            <QuickLink
              href="/dashboard/classes"
              icon={GraduationCap}
              title="Lớp học của tôi"
              description="Xem danh sách lớp và các buổi học"
            />
            <QuickLink
              href="/dashboard/profile"
              icon={UserRound}
              title="Thông tin cá nhân"
              description="Cập nhật hồ sơ học sinh"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group border-divider hover:border-primary/30 hover:bg-primary/5 flex items-center gap-3 rounded-lg border p-3 transition-colors"
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{description}</p>
      </div>
      <ArrowRight className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
    </Link>
  );
}
