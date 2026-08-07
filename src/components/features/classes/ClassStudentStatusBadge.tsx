import { Badge } from '@/components/ui/badge';
import { CLASS_STUDENT_STATUS_LABEL, type ClassStudentStatus } from '@/types/class-management';

const VARIANT: Record<ClassStudentStatus, 'success' | 'secondary'> = {
  STUDYING: 'success',
  LEFT: 'secondary',
};

export default function ClassStudentStatusBadge({ status }: { status: ClassStudentStatus }) {
  return <Badge variant={VARIANT[status]}>{CLASS_STUDENT_STATUS_LABEL[status]}</Badge>;
}
