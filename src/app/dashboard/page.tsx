import Link from 'next/link';
import { ArrowRight, GraduationCap, Radio, School, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/app/EmptyState';
import StatsCard from '@/components/app/StatsCard';
import AttendanceStatsInline from '@/components/features/classes/AttendanceStatsInline';
import { listClasses } from '@/actions/v1/classes/list-classes';
import { getCurrentSession } from '@/lib/server/session';

export default async function DashboardPage() {
  const [session, classesRes] = await Promise.all([
    getCurrentSession(),
    listClasses({ page: 1, pageSize: 100 }),
  ]);
  const displayName = session?.fullName?.trim() || session?.email?.split('@')[0] || 'bạn';
  const activeCount = classesRes.stats.active;

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Lớp đang học"
          value={activeCount}
          icon={GraduationCap}
          tone="primary"
          hint="Số lớp bạn đang tham gia"
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Lớp học của tôi</h2>
        {classesRes.data.length === 0 ? (
          <Card>
            <CardContent className="py-0">
              <EmptyState
                icon={School}
                title="Chưa có lớp học"
                description="Bạn chưa được gán vào lớp học nào. Vui lòng liên hệ giáo viên."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {classesRes.data.map((row) => (
              <Link
                key={row.id}
                href={`/dashboard/classes/${row.id}`}
                className="group focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
              >
                <Card className="hover:border-primary/40 h-full cursor-pointer gap-0 transition hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                          <School className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">{row.name}</CardTitle>
                          <code className="bg-muted text-muted-foreground mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-xs">
                            {row.code}
                          </code>
                        </div>
                      </div>
                      <Badge variant={row.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {row.status === 'ACTIVE' ? 'Đang học' : 'Đã đóng'}
                      </Badge>
                    </div>
                    {row.hasActiveAttendance && (
                      <Badge variant="success" className="mt-2 w-fit gap-1">
                        <Radio className="size-3 animate-pulse" /> Đang mở điểm danh
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 pb-5">
                    {row.description ? (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {row.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">Không có mô tả</p>
                    )}
                    <AttendanceStatsInline
                      attended={row.attendedCount ?? 0}
                      leave={row.leaveCount ?? 0}
                      notAttended={row.notAttendedCount ?? 0}
                    />
                    <div className="text-primary group-hover:text-primary/80 inline-flex items-center gap-1.5 text-sm font-medium">
                      Xem buổi học
                      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
