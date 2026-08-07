import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TUITION_STATUS_LABEL, TUITION_STATUS_VARIANT, type TuitionStatus } from '@/types/tuition';

interface Props {
  status: TuitionStatus;
  amountDue: number;
  amountPaid: number;
  /** true = đang tính từ giá trị nháp, chưa lưu. */
  pending?: boolean;
}

/** `pending` = đang tính từ giá trị nháp, chưa lưu. */
export default function TuitionStatusBadge({ status, amountDue, amountPaid, pending }: Props) {
  // amountDue = 0 -> không có gì để đòi. Đây là cách "miễn học phí" được biểu diễn
  // (đã chốt: không thêm enum riêng), và cũng là trạng thái của lớp chưa xếp buổi.
  if (amountDue === 0 && amountPaid === 0) {
    return (
      <Badge variant="secondary" className={cn(pending && 'border-dashed opacity-80')}>
        Không phải đóng
      </Badge>
    );
  }

  return (
    <Badge
      variant={TUITION_STATUS_VARIANT[status]}
      className={cn(pending && 'border-dashed opacity-80')}
      title={pending ? 'Trạng thái tạm tính — bấm Lưu để ghi nhận' : undefined}
    >
      {TUITION_STATUS_LABEL[status]}
    </Badge>
  );
}
