import { notFound, redirect } from 'next/navigation';
import { getResume } from '@/actions/v1/courses/get-resume';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseEntryPage({ params }: Props) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId) || courseId <= 0) notFound();

  const resume = await getResume(courseId).catch(() => undefined);
  if (resume === null) notFound();

  if (!resume?.nodeId) {
    redirect(`/dashboard/courses/${courseId}/learn`);
  }
  redirect(`/dashboard/courses/${courseId}/learn?item=${resume.nodeId}`);
}
