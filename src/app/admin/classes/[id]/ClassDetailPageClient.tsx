'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Info, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClassInfoTab from '@/components/features/classes/ClassInfoTab';
import ClassStudentsTab from '@/components/features/classes/ClassStudentsTab';
import ClassSessionsTab from '@/components/features/classes/ClassSessionsTab';
import type { ClassStudentSearchValues } from '@/components/features/classes/ClassStudentsSearchForm';
import type { ListMeta } from '@/types/auth';
import type { ClassSessionListRow, ClassStudentListRow } from '@/types/actions/class-management';
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
  students: ClassStudentListRow[];
  studentsMeta: ListMeta;
  studentsErrors: string[];
  sessions: ClassSessionListRow[];
  sessionsMeta: ListMeta;
  sessionsErrors: string[];
}

const DEFAULT_TAB: ClassDetailTab = 'info';
const DEFAULT_PAGE_SIZE = 20;

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

export default function ClassDetailPageClient({
  classDetail,
  urlState,
  students,
  studentsMeta,
  studentsErrors,
  sessions,
  sessionsMeta,
  sessionsErrors,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Tab hiển thị đổi ngay khi bấm; urlState.tab (đến từ server) chỉ dùng để đồng bộ
  // lại khi có điều hướng bên ngoài (back/forward, deep link) — tránh việc tab bị
  // "kẹt" chờ round-trip server rồi mới chuyển, gây cảm giác lag khi bấm tab.
  const [activeTab, setActiveTab] = useState<ClassDetailTab>(urlState.tab);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(urlState.tab);
  }, [urlState.tab]);

  useEffect(() => {
    studentsErrors.forEach((e) => toast.error(e));
  }, [studentsErrors]);

  useEffect(() => {
    sessionsErrors.forEach((e) => toast.error(e));
  }, [sessionsErrors]);

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
          <ClassStudentsTab
            classId={classDetail.id}
            search={studentsSearch}
            rows={students}
            meta={studentsMeta}
            loading={isPending}
            onSearchChange={(v) => updateUrl({ ...v, page: 1 })}
            onPageChange={(p) => updateUrl({ page: p })}
            onPageSizeChange={(s) => updateUrl({ pageSize: s, page: 1 })}
          />
        </TabsContent>
        <TabsContent value="sessions">
          <ClassSessionsTab
            classId={classDetail.id}
            rows={sessions}
            meta={sessionsMeta}
            loading={isPending}
            onPageChange={(p) => updateUrl({ page: p })}
            onPageSizeChange={(s) => updateUrl({ pageSize: s, page: 1 })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
