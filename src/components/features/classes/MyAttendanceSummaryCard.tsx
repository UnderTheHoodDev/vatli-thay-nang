import { CalendarCheck2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClassAttendanceCounts } from '@/types/actions/attendance';

interface Props {
  stats: ClassAttendanceCounts;
}

const ITEMS = [
  { key: 'present', label: 'Đã điểm danh' },
  { key: 'leaveFull', label: 'Nghỉ cả buổi' },
  { key: 'leaveEarly', label: 'Nghỉ giữa chừng' },
  { key: 'absentNoCheckin', label: 'Vắng không điểm danh' },
] as const;

/** Read-only, không hiển thị bất kỳ thông tin học phí nào (issue Phase 4 §III.2). */
export default function MyAttendanceSummaryCard({ stats }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck2 className="size-5" /> Chuyên cần của tôi
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 pb-6 sm:grid-cols-4">
        {ITEMS.map(({ key, label }) => (
          <div key={key}>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="text-foreground text-lg font-semibold">{stats[key]}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
