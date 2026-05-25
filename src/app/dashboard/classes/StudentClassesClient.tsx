'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, School } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/app/EmptyState';
import PageHeader from '@/components/app/PageHeader';
import { handleActionErrors } from '@/lib/actions';
import type { ClassRow } from '@/types/class-management';

interface Props {
  rows: ClassRow[];
  errors: string[];
}

export default function StudentClassesClient({ rows, errors }: Props) {
  useEffect(() => {
    handleActionErrors(errors);
  }, [errors]);

  return (
    <div className="space-y-6">
      <PageHeader title="Lớp học của tôi" description="Danh sách các lớp học bạn đang tham gia." />

      {rows.length === 0 ? (
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
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
                </CardHeader>
                <CardContent className="space-y-3 pb-5">
                  {row.description ? (
                    <p className="text-muted-foreground line-clamp-2 text-sm">{row.description}</p>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">Không có mô tả</p>
                  )}
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
  );
}
