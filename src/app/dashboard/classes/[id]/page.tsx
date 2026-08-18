import { notFound } from 'next/navigation';
import { getMyAttendanceSummary } from '@/actions/v1/attendance/get-my-attendance-summary';
import { getClass } from '@/actions/v1/classes/get-class';
import { listClassSessions } from '@/actions/v1/class-sessions/list-class-sessions';
import { getTuitionReminderMonth } from '@/lib/format';
import StudentClassDetailClient from './StudentClassDetailClient';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function StudentClassDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const classId = Number(id);
  if (!Number.isInteger(classId) || classId <= 0) notFound();

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const pageSize = Number(sp.pageSize) || 20;

  // KHÔNG await — truyền thẳng promise xuống để client stream riêng từng phần
  // (bảng buổi học + thẻ chuyên cần) thay vì chặn cả trang chờ cả 2 xong.
  // Khởi tạo song song với gate getClass() thay vì chờ nối tiếp.
  const sessionsPromise = listClassSessions(classId, { page, pageSize });
  const attendanceSummaryPromise = getMyAttendanceSummary(classId);
  const tuitionReminder = getTuitionReminderMonth();

  const classRow = await getClass(classId);
  if (!classRow) notFound();

  return (
    <StudentClassDetailClient
      classRow={classRow}
      sessionsPromise={sessionsPromise}
      attendanceSummaryPromise={attendanceSummaryPromise}
      page={page}
      pageSize={pageSize}
      tuitionReminder={tuitionReminder}
    />
  );
}
