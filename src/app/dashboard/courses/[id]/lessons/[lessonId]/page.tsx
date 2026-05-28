import { notFound } from 'next/navigation';
import { getLesson } from '@/actions/v1/lessons/get-lesson';
import StudentLessonClient from './StudentLessonClient';

interface Props {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function StudentLessonPage({ params }: Props) {
  const { id, lessonId } = await params;
  const courseId = Number(id);
  const lessonIdNum = Number(lessonId);
  if (!Number.isInteger(courseId) || courseId <= 0) notFound();
  if (!Number.isInteger(lessonIdNum) || lessonIdNum <= 0) notFound();

  const lesson = await getLesson(lessonIdNum);
  if (!lesson) notFound();

  return <StudentLessonClient lesson={lesson} courseId={courseId} />;
}
