import { CircleDollarSign } from 'lucide-react';

interface Props {
  month: number;
  year: number;
  classNames: string[];
}

export default function TuitionReminderBanner({ month, year, classNames }: Props) {
  const classLabel =
    classNames.length > 0 ? ` cho ${classNames.length > 1 ? 'các lớp' : 'lớp'} ${classNames.join(', ')}` : '';

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-50 p-4">
      <CircleDollarSign className="mt-0.5 size-5 shrink-0 text-amber-600" />
      <p className="text-sm text-amber-800">
        Sắp đến hạn đóng học phí tháng {month}/{year}
        {classLabel}. Nếu chưa đóng, vui lòng liên hệ giáo viên/lớp học để hoàn tất học phí.
      </p>
    </div>
  );
}
