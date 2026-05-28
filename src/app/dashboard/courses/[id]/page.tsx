import { notFound } from 'next/navigation';
import { getCourse } from '@/actions/v1/courses/get-course';
import StudentCourseDetailClient from './StudentCourseDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentCourseDetailPage({ params }: Props) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId) || courseId <= 0) notFound();

  const course = await getCourse(courseId);
  if (!course) notFound();

  return <StudentCourseDetailClient course={course} />;
}
