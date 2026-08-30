import PageHeader from '@/components/app/PageHeader';
import { CoursesGridFallback } from './StudentCoursesClient';

export default function CoursesLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Khóa học" description="Khám phá các khóa học vật lí dành cho bạn." />
      <CoursesGridFallback />
    </div>
  );
}
