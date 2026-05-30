import { notFound, redirect } from 'next/navigation';
import { getResume } from '@/actions/v1/courses/get-resume';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Student vào khóa học → KHÔNG hiện trang overview trung gian.
 * Resolve bài đang học dở (resume) / item đầu tiên rồi redirect thẳng vào màn học.
 */
export default async function CourseEntryPage({ params }: Props) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId) || courseId <= 0) notFound();

  // getResume trả null khi 404 (khóa không tồn tại) và throw khi lỗi khác.
  // Lỗi transient (5xx/timeout) → undefined → vẫn vào /learn (getCourse ở đó tự
  // xử lý 404/lỗi của riêng nó) thay vì crash trang entry.
  const resume = await getResume(courseId).catch(() => undefined);
  if (resume === null) notFound(); // 404 thật sự: khóa không tồn tại

  // redirect() throw — đặt ngoài mọi try/catch.
  if (!resume?.lessonItemId) {
    redirect(`/dashboard/courses/${courseId}/learn`);
  }
  redirect(`/dashboard/courses/${courseId}/learn?item=${resume.lessonItemId}`);
}
