import { CalendarCheck2, CalendarOff, CalendarX2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClassAttendanceCounts } from '@/types/actions/attendance';

interface Props {
  stats: ClassAttendanceCounts;
}

const ITEMS = [
  {
    key: 'present',
    label: 'Đã điểm danh',
    icon: CalendarCheck2,
    tone: 'bg-linear-to-br from-emerald-100 to-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
  },
  {
    key: 'leaveFull',
    label: 'Nghỉ cả buổi',
    icon: CalendarOff,
    tone: 'bg-linear-to-br from-amber-100 to-amber-50 text-amber-700 ring-1 ring-amber-600/10',
  },
  {
    key: 'leaveEarly',
    label: 'Nghỉ giữa chừng',
    icon: CalendarX2,
    tone: 'bg-linear-to-br from-amber-100 to-amber-50 text-amber-700 ring-1 ring-amber-600/10',
  },
  {
    key: 'absentNoCheckin',
    label: 'Vắng không điểm danh',
    icon: XCircle,
    tone: 'bg-linear-to-br from-red-100 to-red-50 text-red-600 ring-1 ring-red-600/10',
  },
] as const;

/** Read-only, không hiển thị bất kỳ thông tin học phí nào (issue Phase 4 §III.2). */
export default function MyAttendanceSummaryCard({ stats }: Props) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <CalendarCheck2 className="size-4" />
          </span>
          Chuyên cần của tôi
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 pb-4 sm:grid-cols-4 sm:pb-6">
        {ITEMS.map(({ key, label, icon: Icon, tone }) => (
          <div
            key={key}
            className="hover:ring-primary/15 flex items-center gap-3 rounded-xl p-2 transition-shadow hover:shadow-sm hover:ring-1"
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-foreground text-xl leading-tight font-semibold">{stats[key]}</p>
              <p className="text-muted-foreground truncate text-xs">{label}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
