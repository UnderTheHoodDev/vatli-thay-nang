import { notFound } from 'next/navigation';
import { listAttendanceSummary } from '@/actions/v1/attendance/list-attendance-summary';
import { getClass } from '@/actions/v1/classes/get-class';
import { listClassGroups } from '@/actions/v1/classes/list-class-groups';
import { listClassStudents } from '@/actions/v1/classes/list-class-students';
import { listClassSessions } from '@/actions/v1/class-sessions/list-class-sessions';
import { ALL_VALUE, GROUP_UNASSIGNED_VALUE } from '@/lib/constants';
import ClassDetailPageClient, {
  type ClassDetailTab,
  type ClassDetailUrlState,
} from './ClassDetailPageClient';
import type { ClassStudentStatus } from '@/types/class-management';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): ClassDetailUrlState {
  const tab: ClassDetailTab =
    sp.tab === 'students'
      ? 'students'
      : sp.tab === 'sessions'
        ? 'sessions'
        : sp.tab === 'groups'
          ? 'groups'
          : 'info';
  // Chỉ nhận giá trị hợp lệ — status lạ trên URL rơi về "tất cả".
  const status: string = sp.status === 'STUDYING' || sp.status === 'LEFT' ? sp.status : ALL_VALUE;
  return {
    tab,
    q: sp.q ?? '',
    status,
    group: sp.group ?? ALL_VALUE,
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 50,
  };
}

export default async function ClassDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const classId = Number(id);
  if (!Number.isInteger(classId) || classId <= 0) notFound();

  const sp = await searchParams;
  const urlState = readUrlState(sp);

  // Khởi tạo promise của tab đang active trước, song song với gate getClass() —
  // tránh chờ nối tiếp (getClass xong mới bắt đầu fetch tab).
  const studentsPromise =
    urlState.tab === 'students'
      ? listClassStudents(classId, {
          q: urlState.q || undefined,
          status:
            urlState.status === ALL_VALUE ? undefined : (urlState.status as ClassStudentStatus),
          unassignedGroup: urlState.group === GROUP_UNASSIGNED_VALUE ? true : undefined,
          classGroupId:
            urlState.group !== ALL_VALUE && urlState.group !== GROUP_UNASSIGNED_VALUE
              ? Number(urlState.group)
              : undefined,
          page: urlState.page,
          pageSize: urlState.pageSize,
        })
      : Promise.resolve({
          data: [],
          meta: { total: 0, page: urlState.page, pageSize: urlState.pageSize },
          stats: { total: 0, studying: 0, left: 0 },
          errors: [],
        });
  const attendanceSummaryPromise =
    urlState.tab === 'students'
      ? listAttendanceSummary(classId)
      : Promise.resolve({ data: [], errors: [] });
  const sessionsPromise =
    urlState.tab === 'sessions'
      ? listClassSessions(classId, { page: urlState.page, pageSize: urlState.pageSize })
      : Promise.resolve({
          data: [],
          meta: { total: 0, page: urlState.page, pageSize: urlState.pageSize },
          errors: [],
        });

  // Nhóm cần cho cả tab Học sinh và tab Nhóm lớp.
  const groupsPromise =
    urlState.tab === 'students' || urlState.tab === 'groups'
      ? listClassGroups(classId)
      : Promise.resolve({ data: [], errors: [] });

  const [classDetail, groupsResult] = await Promise.all([getClass(classId), groupsPromise]);
  if (!classDetail) notFound();

  return (
    <ClassDetailPageClient
      classDetail={classDetail}
      urlState={urlState}
      studentsPromise={studentsPromise}
      attendanceSummaryPromise={attendanceSummaryPromise}
      sessionsPromise={sessionsPromise}
      groups={groupsResult.data}
    />
  );
}
