'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ChartEmptyState, ChartLegend, ChartTooltipCard } from './TuitionChartPrimitives';
import { shortMonthLabel } from '@/lib/format';
import type { TuitionChartMonthRow } from '@/types/actions/tuition';

interface Props {
  data: TuitionChartMonthRow[];
}

interface StatusBarDatum {
  [key: string]: string | number;
  monthLabel: string;
  paid: number;
  partial: number;
  unpaid: number;
}

const COLOR = {
  paid: '#059669',
  partial: '#d97706',
  unpaid: '#e11d48',
} as const;

const LABEL: Record<keyof typeof COLOR, string> = {
  paid: 'Đã đóng đủ',
  partial: 'Đóng thiếu',
  unpaid: 'Chưa đóng',
};

/** Bar chart xếp chồng số HỌC SINH theo trạng thái đóng học phí, mỗi tháng 1 cột. */
export default function TuitionStatusTrendChart({ data }: Props) {
  const chartData: StatusBarDatum[] = data.map((d) => ({
    monthLabel: shortMonthLabel(d.year, d.month),
    paid: d.paidCount,
    partial: d.partialCount,
    unpaid: d.unpaidCount,
  }));

  const empty = data.every((d) => d.paidCount + d.partialCount + d.unpaidCount === 0);
  if (empty) {
    return <ChartEmptyState message="Chưa có học sinh nào trong khoảng thời gian này" />;
  }

  // Nhiều tháng (khoảng rộng, tối đa 16) thì nhãn "MM/YY" đứng thẳng sẽ đè lên
  // nhau — xoay chéo + nới đáy để vẫn đọc được.
  const dense = chartData.length > 8;

  return (
    <div className="space-y-2">
      <div className="h-[300px] w-full">
        <ResponsiveBar
          data={chartData}
          keys={['paid', 'partial', 'unpaid']}
          indexBy="monthLabel"
          margin={{ top: 10, right: 10, bottom: dense ? 56 : 40, left: 40 }}
          padding={0.3}
          groupMode="stacked"
          colors={({ id }) => COLOR[id as keyof typeof COLOR]}
          borderRadius={2}
          axisBottom={{
            tickSize: 0,
            tickPadding: 8,
            tickRotation: dense ? -45 : 0,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 6,
            format: (v) => (Number.isInteger(v) ? String(v) : ''),
          }}
          enableLabel={false}
          enableGridY
          gridYValues={4}
          tooltip={({ id, value, indexValue }) => (
            <ChartTooltipCard>
              <p className="text-foreground font-medium">Tháng {indexValue}</p>
              <p className="text-muted-foreground">
                {LABEL[id as keyof typeof COLOR]}:{' '}
                <span className="text-foreground font-medium">{value} học sinh</span>
              </p>
            </ChartTooltipCard>
          )}
          role="img"
          ariaLabel="Xu hướng số học sinh theo trạng thái đóng học phí"
        />
      </div>
      <ChartLegend
        items={(Object.keys(COLOR) as Array<keyof typeof COLOR>).map((key) => ({
          key,
          color: COLOR[key],
          label: LABEL[key],
        }))}
      />
    </div>
  );
}
