'use client';

import { useCallback, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Info, LayoutList, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseInfoTab from '@/components/features/courses/CourseInfoTab';
import CourseStructureTab from '@/components/features/courses/CourseStructureTab';
import CourseEnrollmentsTab from '@/components/features/courses/CourseEnrollmentsTab';
import type { ListMeta } from '@/types/auth';
import type {
  CourseCategoryRow,
  CourseDetail,
  CourseEnrollmentRow,
  CourseStatus,
} from '@/types/course-management';

export type CourseDetailTab = 'info' | 'structure' | 'enrollments';

export interface CourseDetailUrlState {
  tab: CourseDetailTab;
  email: string;
  fullName: string;
  page: number;
  pageSize: number;
}

interface Props {
  course: CourseDetail;
  urlState: CourseDetailUrlState;
  categories: CourseCategoryRow[];
  enrollments: CourseEnrollmentRow[];
  enrollmentsMeta: ListMeta;
  enrollmentsErrors: string[];
}

const DEFAULT_TAB: CourseDetailTab = 'info';
const DEFAULT_PAGE_SIZE = 20;

function buildUrlParams(state: CourseDetailUrlState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.tab !== DEFAULT_TAB) sp.set('tab', state.tab);
  if (state.email) sp.set('email', state.email);
  if (state.fullName) sp.set('fullName', state.fullName);
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== DEFAULT_PAGE_SIZE) sp.set('pageSize', String(state.pageSize));
  return sp;
}

function statusBadge(s: CourseStatus) {
  if (s === 'PUBLISHED') return <Badge variant="success">Đang phát hành</Badge>;
  if (s === 'DRAFT') return <Badge variant="warning">Bản nháp</Badge>;
  return <Badge variant="secondary">Đã lưu trữ</Badge>;
}

export default function CourseDetailPageClient({
  course,
  urlState,
  categories,
  enrollments,
  enrollmentsMeta,
  enrollmentsErrors,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    enrollmentsErrors.forEach((e) => toast.error(e));
  }, [enrollmentsErrors]);

  const updateUrl = useCallback(
    (next: Partial<CourseDetailUrlState>) => {
      const merged = { ...urlState, ...next };
      const params = buildUrlParams(merged);
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname, urlState],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground w-fit cursor-pointer pl-1"
        >
          <Link href="/admin/courses">
            <ArrowLeft /> Danh sách khóa học
          </Link>
        </Button>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-paytone text-foreground text-2xl tracking-tight">
              {course.title}
            </h1>
            {statusBadge(course.status)}
          </div>
          <p className="text-muted-foreground text-sm">
            Mã khóa học:{' '}
            <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
              {course.code}
            </code>
            <span className="mx-2">·</span>
            <span>{course.category?.name}</span>
            <span className="mx-2">·</span>
            <span>{course.enrollmentCount ?? 0} học sinh</span>
          </p>
        </div>
      </div>

      <Tabs
        value={urlState.tab}
        onValueChange={(v) => updateUrl({ tab: v as CourseDetailTab, page: 1 })}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="info" className="cursor-pointer">
            <Info className="size-4" /> Thông tin
          </TabsTrigger>
          <TabsTrigger value="structure" className="cursor-pointer">
            <LayoutList className="size-4" /> Nội dung
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="cursor-pointer">
            <UsersIcon className="size-4" /> Học sinh
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <CourseInfoTab course={course} categories={categories} />
        </TabsContent>

        <TabsContent value="structure">
          <CourseStructureTab course={course} />
        </TabsContent>

        <TabsContent value="enrollments">
          <CourseEnrollmentsTab
            courseId={course.id}
            search={{ email: urlState.email, fullName: urlState.fullName }}
            rows={enrollments}
            meta={enrollmentsMeta}
            loading={isPending}
            onSearchChange={(v) => updateUrl({ ...v, page: 1 })}
            onPageChange={(p) => updateUrl({ page: p })}
            onPageSizeChange={(s) => updateUrl({ pageSize: s, page: 1 })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
