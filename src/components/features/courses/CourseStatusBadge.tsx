import { Badge } from '@/components/ui/badge';
import { COURSE_STATUS_LABEL, type CourseStatus } from '@/types/course-management';

const VARIANT: Record<CourseStatus, 'success' | 'warning' | 'secondary'> = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'secondary',
};

/** Badge trạng thái khóa học dùng chung (list, detail header, info tab). */
export default function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return <Badge variant={VARIANT[status]}>{COURSE_STATUS_LABEL[status]}</Badge>;
}
