'use client';

import { Suspense, use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Info, LayoutList, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTableFilters } from '@/components/app/table-filters/useTableFilters';
import { useIsTeachingAssistant } from '@/components/app/RoleProvider';
import CourseInfoTab from '@/components/features/courses/CourseInfoTab';
import CourseStructureTab from '@/components/features/courses/CourseStructureTab';
import CourseEnrollmentsTab, {
  type CourseEnrollmentsStatusFilter,
} from '@/components/features/courses/CourseEnrollmentsTab';
import CourseStatsTab from '@/components/features/courses/CourseStatsTab';
import CourseStatusBadge from '@/components/features/courses/CourseStatusBadge';
import CourseTestsSection from '@/components/features/tests/CourseTestsSection';
import { ALL_VALUE } from '@/lib/constants';
import type { CourseDetail } from '@/types/course-management';
import type { ListCourseEnrollmentsResponse } from '@/actions/v1/courses/list-course-enrollments';

export type CourseDetailTab = 'info' | 'structure' | 'enrollments' | 'stats';

export interface CourseDetailUrlState {
  tab: CourseDetailTab;
  /** Tìm gộp (OR): email, họ tên. */
  q: string;
  status: string;
  /** ALL_VALUE | "<classId>". */
  classId: string;
  enrolledFrom: string;
  enrolledTo: string;
  page: number;
  pageSize: number;
  [key: string]: string | number;
}

interface Props {
  course: CourseDetail;
  urlState: CourseDetailUrlState;
  enrollmentsPromise: Promise<ListCourseEnrollmentsResponse>;
}

const DEFAULTS: CourseDetailUrlState = {
  tab: 'info',
  q: '',
  status: ALL_VALUE,
  classId: ALL_VALUE,
  enrolledFrom: '',
  enrolledTo: '',
  page: 1,
  pageSize: 20,
};

interface EnrollmentsTabHandlers {
  onQChange: (q: string) => void;
  statusFilter: CourseEnrollmentsStatusFilter;
  classId: string;
  onClassIdChange: (v: string) => void;
  enrolledFrom: string;
  enrolledTo: string;
  onEnrolledFromChange: (v: string) => void;
  onEnrolledToChange: (v: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function EnrollmentsTabData({
  promise,
  courseId,
  q,
  isPending,
  handlers,
}: {
  promise: Promise<ListCourseEnrollmentsResponse>;
  courseId: number;
  q: string;
  isPending: boolean;
  handlers: EnrollmentsTabHandlers;
}) {
  const { data, meta, errors } = use(promise);

  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);

  return (
    <CourseEnrollmentsTab
      courseId={courseId}
      q={q}
      rows={data}
      meta={meta}
      loading={isPending}
      {...handlers}
    />
  );
}

export default function CourseDetailPageClient({ course, urlState, enrollmentsPromise }: Props) {
  const isTA = useIsTeachingAssistant();
  const filters = useTableFilters({ urlState, defaults: DEFAULTS });

  const [activeTab, setActiveTab] = useState<CourseDetailTab>(urlState.tab);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(urlState.tab);
  }, [urlState.tab]);

  function handleTabChange(v: string) {
    const tab = v as CourseDetailTab;
    setActiveTab(tab);
    filters.setValue('tab', tab);
  }

  const statusFilter: CourseEnrollmentsStatusFilter = {
    value: urlState.status,
    options: [
      { value: 'ACTIVE', label: 'Đang học' },
      { value: 'REVOKED', label: 'Đã thu hồi' },
    ],
    onChange: (v) => filters.setValue('status', v),
  };
  const q = filters.value('q');
  const onQChange = (v: string) => filters.setText('q', v);
  const onPageChange = (p: number) => filters.setPaging({ page: p });
  const onPageSizeChange = (s: number) => filters.setPaging({ pageSize: s, page: 1 });
  const onClassIdChange = (v: string) => filters.setValue('classId', v);
  const onEnrolledFromChange = (v: string) => filters.setValue('enrolledFrom', v);
  const onEnrolledToChange = (v: string) => filters.setValue('enrolledTo', v);
  // Xoá các bộ lọc ghi danh, giữ nguyên tab đang xem (khác filters.clearAll — reset cả tab).
  const onClearFilters = () =>
    filters.push({
      q: '',
      status: ALL_VALUE,
      classId: ALL_VALUE,
      enrolledFrom: '',
      enrolledTo: '',
    });

  const enrollmentsHandlers: EnrollmentsTabHandlers = {
    onQChange,
    statusFilter,
    classId: urlState.classId,
    onClassIdChange,
    enrolledFrom: urlState.enrolledFrom,
    enrolledTo: urlState.enrolledTo,
    onEnrolledFromChange,
    onEnrolledToChange,
    onClearFilters,
    onPageChange,
    onPageSizeChange,
  };

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
            <h1 className="font-paytone text-foreground text-2xl tracking-tight">{course.title}</h1>
            <CourseStatusBadge status={course.status} />
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1">
              Mã khóa học:
              <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                {course.code}
              </code>
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span>
              <span className="text-foreground font-semibold">{course.enrollmentCount ?? 0}</span>{' '}
              học sinh
            </span>
          </div>
        </div>
      </div>

      {isTA ? (
        // Trợ giảng: chỉ để chấm bài — không cần tab Thông tin/Nội dung/Học sinh/Thống kê,
        // chỉ hiện thẳng danh sách Bài kiểm tra (vốn nằm cuối tab Nội dung cho admin).
        <CourseTestsSection courseId={course.id} />
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
          <TabsList className="max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="info" className="shrink-0 cursor-pointer">
              <Info className="size-4" /> Thông tin
            </TabsTrigger>
            <TabsTrigger value="structure" className="shrink-0 cursor-pointer">
              <LayoutList className="size-4" /> Nội dung
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="shrink-0 cursor-pointer">
              <UsersIcon className="size-4" /> Học sinh
            </TabsTrigger>
            <TabsTrigger value="stats" className="shrink-0 cursor-pointer">
              <BarChart3 className="size-4" /> Thống kê
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <CourseInfoTab course={course} />
          </TabsContent>

          <TabsContent value="structure">
            <CourseStructureTab course={course} />
          </TabsContent>

          <TabsContent value="enrollments">
            <Suspense
              fallback={
                <CourseEnrollmentsTab
                  courseId={course.id}
                  q={q}
                  rows={[]}
                  meta={{ total: 0, page: urlState.page, pageSize: urlState.pageSize }}
                  loading
                  {...enrollmentsHandlers}
                />
              }
            >
              <EnrollmentsTabData
                promise={enrollmentsPromise}
                courseId={course.id}
                q={q}
                isPending={filters.isPending}
                handlers={enrollmentsHandlers}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="stats">
            <CourseStatsTab courseId={course.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
