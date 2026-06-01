'use client';

import { useCallback, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import PageHeader from '@/components/app/PageHeader';
import { handleActionErrors } from '@/lib/actions';
import type { ListMeta } from '@/types/auth';
import type { CourseRow } from '@/types/course-management';

export interface UrlState {
  page: number;
  pageSize: number;
}

interface Props {
  urlState: UrlState;
  rows: CourseRow[];
  meta: ListMeta;
  errors: string[];
}

function formatVnd(v: number | null | undefined): string {
  if (!v || v <= 0) return 'Miễn phí';
  return `${v.toLocaleString('vi-VN')} đ`;
}

export default function StudentCoursesClient({ urlState, rows, meta, errors }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  useEffect(() => {
    handleActionErrors(errors);
  }, [errors]);

  const updateUrl = useCallback(
    (next: Partial<UrlState>) => {
      const merged = { ...urlState, ...next };
      const sp = new URLSearchParams();
      if (merged.page !== 1) sp.set('page', String(merged.page));
      if (merged.pageSize !== 20) sp.set('pageSize', String(merged.pageSize));
      const query = sp.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname, urlState],
  );

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.pageSize));

  return (
    <div className="space-y-6">
      <PageHeader title="Khóa học" description="Khám phá các khóa học vật lí dành cho bạn." />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={BookOpen}
              title="Chưa có khóa học"
              description="Hiện chưa có khóa học nào được phát hành."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/dashboard/courses/${row.id}`}
              className="group focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="hover:border-primary/40 h-full cursor-pointer gap-0 overflow-hidden p-0 transition hover:shadow-md">
                <div className="bg-muted relative aspect-video w-full overflow-hidden">
                  {row.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.thumbnailUrl}
                      alt={row.title}
                      className="size-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center">
                      <BookOpen className="size-10" />
                    </div>
                  )}
                  {row.isEnrolled && (
                    <Badge
                      variant="success"
                      className="absolute top-2 right-2 flex items-center gap-1"
                    >
                      <CheckCircle2 className="size-3" /> Đã ghi danh
                    </Badge>
                  )}
                </div>
                <CardHeader className="pt-4 pb-2">
                  <CardTitle className="line-clamp-2 text-base">{row.title}</CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                      {row.code}
                    </code>
                    {row.category?.name && (
                      <Badge variant="secondary" className="text-[10px]">
                        {row.category.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-5">
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {row.description || 'Không có mô tả'}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-primary text-sm font-semibold">
                      {formatVnd(row.price)}
                    </span>
                    <span className="text-primary group-hover:text-primary/80 inline-flex items-center gap-1.5 text-sm font-medium">
                      {row.isEnrolled ? 'Tiếp tục học' : 'Vào học'}
                      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <DataPagination
            page={meta.page}
            totalPages={totalPages}
            onPageChange={(p) => updateUrl({ page: p })}
          />
        </div>
      )}
    </div>
  );
}
