'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ChartEmptyState, ChartLegend, ChartTooltipCard } from './TuitionChartPrimitives';
import { formatAmountVnd, formatCompactVnd, shortMonthLabel } from '@/lib/format';
import type { TuitionChartMonthRow } from '@/types/actions/tuition';

interface Props {
  data: TuitionChartMonthRow[];
}

/** nivo đòi datum có index signature và giá trị chỉ string|number. */
interface RevenueBarDatum {
  [key: string]: string | number;
  monthLabel: string;
  paid: number;
  remaining: number;
}

const COLOR = {
  paid: '#723bcf',
  remaining: '#f0c040',
} as const;

/**
 * Bar chart xếp chồng: "Đã thu" xếp dưới, "Còn thiếu" xếp trên — chiều cao cả
 * cột luôn bằng đúng "Phải thu" của tháng đó, trực quan hoá % đã thu ngay
 * trong 1 cột thay vì phải nhìn 2 chart riêng.
 */
export default function TuitionRevenueTrendChart({ data }: Props) {
  const chartData: RevenueBarDatum[] = data.map((d) => ({
    monthLabel: shortMonthLabel(d.year, d.month),
    paid: d.amountPaidTotal,
    remaining: Math.max(0, d.amountDueTotal - d.amountPaidTotal),
  }));

  const empty = data.every((d) => d.amountDueTotal === 0 && d.amountPaidTotal === 0);
  if (empty) {
    return <ChartEmptyState message="Chưa có dữ liệu học phí trong khoảng thời gian này" />;
  }

  // Nhiều tháng (khoảng rộng, tối đa 16) thì nhãn "MM/YY" đứng thẳng sẽ đè lên
  // nhau — xoay chéo + nới đáy để vẫn đọc được.
  const dense = chartData.length > 8;

  return (
    <div className="space-y-2">
      <div className="h-[300px] w-full">
        <ResponsiveBar
          data={chartData}
          keys={['paid', 'remaining']}
          indexBy="monthLabel"
          margin={{ top: 10, right: 10, bottom: dense ? 56 : 40, left: 56 }}
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
            format: (v) => formatCompactVnd(Number(v)),
          }}
          enableLabel={false}
          enableGridY
          gridYValues={4}
          tooltip={({ id, value, indexValue }) => (
            <ChartTooltipCard>
              <p className="text-foreground font-medium">Tháng {indexValue}</p>
              <p className="text-muted-foreground">
                {id === 'paid' ? 'Đã thu' : 'Còn thiếu'}:{' '}
                <span className="text-foreground font-medium">{formatAmountVnd(value)}</span>
              </p>
            </ChartTooltipCard>
          )}
          role="img"
          ariaLabel="Xu hướng học phí theo tháng"
        />
      </div>
      <ChartLegend
        items={[
          { key: 'paid', color: COLOR.paid, label: 'Đã thu' },
          { key: 'remaining', color: COLOR.remaining, label: 'Còn thiếu' },
        ]}
      />
    </div>
  );
}
