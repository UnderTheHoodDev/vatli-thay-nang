import { CheckCircle2, LogOut, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ClassAttendanceCounts } from '@/types/actions/attendance';

interface Props {
  stats?: ClassAttendanceCounts;
}

export default function AttendanceSummaryCell({ stats }: Props) {
  if (!stats) return <span className="text-muted-foreground">—</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="text-muted-foreground flex w-fit items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1" title="Đã điểm danh">
            <CheckCircle2 className="size-3.5 text-emerald-600" /> {stats.present}
          </span>
          <span className="inline-flex items-center gap-1" title="Tổng nghỉ">
            <LogOut className="size-3.5 text-amber-600" /> {stats.totalLeave}
          </span>
          <span className="inline-flex items-center gap-1" title="Vắng không điểm danh">
            <XCircle className="size-3.5 text-red-500" /> {stats.absentNoCheckin}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-0.5">
          <p>Tổng số buổi: {stats.totalSessions}</p>
          <p>Đã điểm danh: {stats.present}</p>
          <p>Nghỉ cả buổi: {stats.leaveFull}</p>
          <p>Nghỉ giữa chừng: {stats.leaveEarly}</p>
          <p>Vắng không điểm danh: {stats.absentNoCheckin}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
