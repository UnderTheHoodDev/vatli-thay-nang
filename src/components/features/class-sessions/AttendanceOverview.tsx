'use client';

import { CalendarOff, CheckCircle2, UserMinus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/app/StatsCard';
import type { AttendanceSummary } from '@/types/actions/attendance';

interface Props {
  counts: AttendanceSummary['counts'] | null;
}

export default function AttendanceOverview({ counts }: Props) {
  const total = counts?.total ?? 0;
  const attended = counts?.attended ?? 0;
  const notAttended = counts?.notAttended ?? 0;
  const onLeave = counts?.onLeave ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Báo cáo tổng quan</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Tổng học sinh" value={total} icon={Users} tone="primary" />
          <StatsCard label="Đã điểm danh" value={attended} icon={CheckCircle2} tone="success" />
          <StatsCard label="Chưa điểm danh" value={notAttended} icon={UserMinus} tone="warning" />
          <StatsCard label="Xin nghỉ" value={onLeave} icon={CalendarOff} tone="destructive" />
        </div>
      </CardContent>
    </Card>
  );
}
