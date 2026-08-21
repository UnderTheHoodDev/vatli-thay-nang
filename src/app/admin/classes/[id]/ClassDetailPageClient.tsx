'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Info, Users as UsersIcon, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTableFilters } from '@/components/app/table-filters/useTableFilters';
import ClassInfoTab from '@/components/features/classes/ClassInfoTab';
import ClassStudentsTab from '@/components/features/classes/ClassStudentsTab';
import ClassSessionsTab from '@/components/features/classes/ClassSessionsTab';
import { useResolved } from '@/lib/actions';
import { ALL_VALUE } from '@/lib/constants';
import type { ClassStudentsStatusFilter } from '@/components/features/classes/ClassStudentsTable';
import type { ListAttendanceSummaryResponse } from '@/actions/v1/attendance/list-attendance-summary';
import type { ListClassSessionsResponse } from '@/actions/v1/class-sessions/list-class-sessions';
import type { ListClassStudentsResponse } from '@/actions/v1/classes/list-class-students';
import {
  CLASS_STUDENT_STATUS_LABEL,
  type ClassDetail,
  type ClassStatus,
} from '@/types/class-management';

export type ClassDetailTab = 'info' | 'students' | 'sessions';

export interface ClassDetailUrlState {
  tab: ClassDetailTab;
  /** Tìm gộp (OR): email, họ tên học sinh. */
  q: string;
  status: string;
  page: number;
  pageSize: number;
  [key: string]: string | number;
}

interface Props {
  classDetail: ClassDetail;
  urlState: ClassDetailUrlState;
  studentsPromise: Promise<ListClassStudentsResponse>;
  attendanceSummaryPromise: Promise<ListAttendanceSummaryResponse>;
  sessionsPromise: Promise<ListClassSessionsResponse>;
}

const DEFAULTS: ClassDetailUrlState = {
  tab: 'info',
  q: '',
  status: ALL_VALUE,
  page: 1,
  pageSize: 50,
};

const CLASS_STUDENT_STATUS_OPTIONS = Object.entries(CLASS_STUDENT_STATUS_LABEL).map(
  ([value, label]) => ({ value, label }),
);

function statusBadge(s: ClassStatus) {
  if (s === 'ACTIVE') return <Badge variant="success">Đang hoạt động</Badge>;
  return <Badge variant="secondary">Đã đóng</Badge>;
}

interface StudentsSectionProps {
  classId: number;
  q: string;
  statusFilter: ClassStudentsStatusFilter;
  studentsPromise: Promise<ListClassStudentsResponse>;
  attendanceSummaryPromise: Promise<ListAttendanceSummaryResponse>;
  isPending: boolean;
  onQChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function StudentsSection({
  classId,
  q,
  statusFilter,
  studentsPromise,
  attendanceSummaryPromise,
  isPending,
  onQChange,
  onPageChange,
  onPageSizeChange,
}: StudentsSectionProps) {
  const { data: rows, meta } = useResolved(studentsPromise);
  const { data: attendanceStats } = useResolved(attendanceSummaryPromise);

  return (
    <ClassStudentsTab
      classId={classId}
      q={q}
      statusFilter={statusFilter}
      rows={rows}
      attendanceStats={attendanceStats}
      meta={meta}
      loading={isPending}
      onQChange={onQChange}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}

interface SessionsSectionProps {
  classId: number;
  sessionsPromise: Promise<ListClassSessionsResponse>;
  isPending: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function SessionsSection({
  classId,
  sessionsPromise,
  isPending,
  onPageChange,
  onPageSizeChange,
}: SessionsSectionProps) {
  const { data: rows, meta } = useResolved(sessionsPromise);

  return (
    <ClassSessionsTab
      classId={classId}
      rows={rows}
      meta={meta}
      loading={isPending}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}

export default function ClassDetailPageClient({
  classDetail,
  urlState,
  studentsPromise,
  attendanceSummaryPromise,
  sessionsPromise,
}: Props) {
  const filters = useTableFilters({ urlState, defaults: DEFAULTS });

  const [activeTab, setActiveTab] = useState<ClassDetailTab>(urlState.tab);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(urlState.tab);
  }, [urlState.tab]);

  function handleTabChange(v: string) {
    const tab = v as ClassDetailTab;
    setActiveTab(tab);
    // setValue reset page về 1 — giữ hành vi đổi tab cũ.
    filters.setValue('tab', tab);
  }

  const statusFilter: ClassStudentsStatusFilter = {
    value: urlState.status,
    options: CLASS_STUDENT_STATUS_OPTIONS,
    onChange: (v) => filters.setValue('status', v),
  };
  const q = filters.value('q');
  const onQChange = (v: string) => filters.setText('q', v);
  const onPageChange = (p: number) => filters.setPaging({ page: p });
  const onPageSizeChange = (s: number) => filters.setPaging({ pageSize: s, page: 1 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground w-fit cursor-pointer pl-1"
        >
          <Link href="/admin/classes">
            <ArrowLeft /> Danh sách lớp học
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-paytone text-foreground text-2xl tracking-tight">
                {classDetail.name}
              </h1>
              {statusBadge(classDetail.status)}
            </div>
            <p className="text-muted-foreground text-sm">
              Mã lớp:{' '}
              <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                {classDetail.code}
              </code>
              <span className="mx-2">·</span>
              <span>{classDetail.studentCount ?? 0} học sinh</span>
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link href={`/admin/tuition/${classDetail.id}`}>
              <Wallet /> Học phí lớp
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
        <TabsList>
          <TabsTrigger value="info" className="cursor-pointer">
            <Info className="size-4" /> Thông tin
          </TabsTrigger>
          <TabsTrigger value="students" className="cursor-pointer">
            <UsersIcon className="size-4" /> Học sinh
          </TabsTrigger>
          <TabsTrigger value="sessions" className="cursor-pointer">
            <Calendar className="size-4" /> Buổi học
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <ClassInfoTab classDetail={classDetail} />
        </TabsContent>
        <TabsContent value="students">
          <Suspense
            fallback={
              <ClassStudentsTab
                classId={classDetail.id}
                q={q}
                statusFilter={statusFilter}
                rows={[]}
                attendanceStats={[]}
                meta={{ total: 0, page: urlState.page, pageSize: urlState.pageSize }}
                loading
                onQChange={onQChange}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            }
          >
            <StudentsSection
              classId={classDetail.id}
              q={q}
              statusFilter={statusFilter}
              studentsPromise={studentsPromise}
              attendanceSummaryPromise={attendanceSummaryPromise}
              isPending={filters.isPending}
              onQChange={onQChange}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="sessions">
          <Suspense
            fallback={
              <ClassSessionsTab
                classId={classDetail.id}
                rows={[]}
                meta={{ total: 0, page: urlState.page, pageSize: urlState.pageSize }}
                loading
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            }
          >
            <SessionsSection
              classId={classDetail.id}
              sessionsPromise={sessionsPromise}
              isPending={filters.isPending}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
