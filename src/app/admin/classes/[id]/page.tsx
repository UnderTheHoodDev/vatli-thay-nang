import { notFound } from 'next/navigation';
import { listAttendanceSummary } from '@/actions/v1/attendance/list-attendance-summary';
import { getClass } from '@/actions/v1/classes/get-class';
import { listClassStudents } from '@/actions/v1/classes/list-class-students';
import { listClassSessions } from '@/actions/v1/class-sessions/list-class-sessions';
import ClassDetailPageClient, {
  type ClassDetailTab,
  type ClassDetailUrlState,
} from './ClassDetailPageClient';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): ClassDetailUrlState {
  const tab: ClassDetailTab =
    sp.tab === 'students' ? 'students' : sp.tab === 'sessions' ? 'sessions' : 'info';
  return {
    tab,
    email: sp.email ?? '',
    fullName: sp.fullName ?? '',
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
          email: urlState.email || undefined,
          fullName: urlState.fullName || undefined,
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

  const classDetail = await getClass(classId);
  if (!classDetail) notFound();

  return (
    <ClassDetailPageClient
      classDetail={classDetail}
      urlState={urlState}
      studentsPromise={studentsPromise}
      attendanceSummaryPromise={attendanceSummaryPromise}
      sessionsPromise={sessionsPromise}
    />
  );
}
