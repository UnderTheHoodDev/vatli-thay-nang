'use client';

import { Suspense, useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Info, Users as UsersIcon, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClassInfoTab from '@/components/features/classes/ClassInfoTab';
import ClassStudentsTab from '@/components/features/classes/ClassStudentsTab';
import ClassSessionsTab from '@/components/features/classes/ClassSessionsTab';
import { useResolved } from '@/lib/actions';
import type { ClassStudentSearchValues } from '@/components/features/classes/ClassStudentsSearchForm';
import type { ListAttendanceSummaryResponse } from '@/actions/v1/attendance/list-attendance-summary';
import type { ListClassSessionsResponse } from '@/actions/v1/class-sessions/list-class-sessions';
import type { ListClassStudentsResponse } from '@/actions/v1/classes/list-class-students';
import type { ClassDetail, ClassStatus } from '@/types/class-management';

export type ClassDetailTab = 'info' | 'students' | 'sessions';

export interface ClassDetailUrlState extends ClassStudentSearchValues {
  tab: ClassDetailTab;
  page: number;
  pageSize: number;
}

interface Props {
  classDetail: ClassDetail;
  urlState: ClassDetailUrlState;
  studentsPromise: Promise<ListClassStudentsResponse>;
  attendanceSummaryPromise: Promise<ListAttendanceSummaryResponse>;
  sessionsPromise: Promise<ListClassSessionsResponse>;
}

const DEFAULT_TAB: ClassDetailTab = 'info';
const DEFAULT_PAGE_SIZE = 50;

function buildUrlParams(state: ClassDetailUrlState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.tab !== DEFAULT_TAB) sp.set('tab', state.tab);
  if (state.email) sp.set('email', state.email);
  if (state.fullName) sp.set('fullName', state.fullName);
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== DEFAULT_PAGE_SIZE) sp.set('pageSize', String(state.pageSize));
  return sp;
}

function statusBadge(s: ClassStatus) {
  if (s === 'ACTIVE') return <Badge variant="success">Đang hoạt động</Badge>;
  return <Badge variant="secondary">Đã đóng</Badge>;
}

interface StudentsSectionProps {
  classId: number;
  search: ClassStudentSearchValues;
  studentsPromise: Promise<ListClassStudentsResponse>;
  attendanceSummaryPromise: Promise<ListAttendanceSummaryResponse>;
  isPending: boolean;
  onSearchChange: (next: ClassStudentSearchValues) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function StudentsSection({
  classId,
  search,
  studentsPromise,
  attendanceSummaryPromise,
  isPending,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
}: StudentsSectionProps) {
  const { data: rows, meta } = useResolved(studentsPromise);
  const { data: attendanceStats } = useResolved(attendanceSummaryPromise);

  return (
    <ClassStudentsTab
      classId={classId}
      search={search}
      rows={rows}
      attendanceStats={attendanceStats}
      meta={meta}
      loading={isPending}
      onSearchChange={onSearchChange}
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
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<ClassDetailTab>(urlState.tab);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(urlState.tab);
  }, [urlState.tab]);

  const updateUrl = useCallback(
    (next: Partial<ClassDetailUrlState>) => {
      const merged = { ...urlState, ...next };
      const params = buildUrlParams(merged);
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname, urlState],
  );

  function handleTabChange(v: string) {
    const tab = v as ClassDetailTab;
    setActiveTab(tab);
    updateUrl({ tab, page: 1 });
  }

  const studentsSearch: ClassStudentSearchValues = {
    email: urlState.email,
    fullName: urlState.fullName,
  };

  const onSearchChange = useCallback(
    (v: ClassStudentSearchValues) => updateUrl({ ...v, page: 1 }),
    [updateUrl],
  );
  const onPageChange = useCallback((p: number) => updateUrl({ page: p }), [updateUrl]);
  const onPageSizeChange = useCallback(
    (s: number) => updateUrl({ pageSize: s, page: 1 }),
    [updateUrl],
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
                search={studentsSearch}
                rows={[]}
                attendanceStats={[]}
                meta={{ total: 0, page: urlState.page, pageSize: urlState.pageSize }}
                loading
                onSearchChange={onSearchChange}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            }
          >
            <StudentsSection
              classId={classDetail.id}
              search={studentsSearch}
              studentsPromise={studentsPromise}
              attendanceSummaryPromise={attendanceSummaryPromise}
              isPending={isPending}
              onSearchChange={onSearchChange}
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
              isPending={isPending}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
