'use client';

import { ResponsiveBar } from '@nivo/bar';
import type { ScoreBin } from '@/types/tests';

interface Props {
  distribution: ScoreBin[];
  /** Điểm của chính mình — đánh dấu cột chứa nó (dùng ở màn học sinh). */
  highlightScore?: number | null;
  maxScore: number;
}

/** nivo đòi datum có index signature và giá trị chỉ string|number (không boolean). */
interface ScoreBarDatum {
  [key: string]: string | number;
  range: string;
  count: number;
  /** 1 = cột chứa điểm của mình. */
  mine: number;
}

/**
 * Phổ điểm: chia [0, maxScore] thành 10 bin đều, trục Y là SỐ HỌC SINH.
 * BE đã dựng sẵn bin (kể cả bin count = 0) nên FE không tự chia lại.
 */
export default function ScoreDistributionChart({ distribution, highlightScore, maxScore }: Props) {
  const data: ScoreBarDatum[] = distribution.map((b) => ({
    range: `${b.from}–${b.to}`,
    count: b.count,
    // Điểm tuyệt đối rơi vào bin cuối (BE kẹp như vậy), nên bin cuối phải bao gồm cả `to`.
    mine:
      highlightScore != null &&
      highlightScore >= b.from &&
      (highlightScore < b.to || (b.to === maxScore && highlightScore === maxScore))
        ? 1
        : 0,
  }));

  const empty = distribution.every((b) => b.count === 0);
  if (empty) {
    return (
      <div className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
        Chưa có bài nào được chấm
      </div>
    );
  }

  return (
    // nivo cần cha có chiều cao cố định.
    <div className="h-[260px] w-full">
      <ResponsiveBar
        data={data}
        keys={['count']}
        indexBy="range"
        margin={{ top: 10, right: 10, bottom: 48, left: 40 }}
        padding={0.25}
        colors={({ data: d }) => ((d as ScoreBarDatum).mine ? '#723bcf' : '#c4b5fd')}
        borderRadius={3}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          legend: 'Khoảng điểm',
          legendPosition: 'middle',
          legendOffset: 38,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 6,
          // Số học sinh là số nguyên — đừng vẽ 0.5 học sinh.
          format: (v) => (Number.isInteger(v) ? String(v) : ''),
          legend: 'Số học sinh',
          legendPosition: 'middle',
          legendOffset: -32,
        }}
        enableLabel={false}
        enableGridY
        tooltip={({ indexValue, value }) => (
          <div className="bg-card border-divider rounded border px-2 py-1 text-xs shadow">
            <strong>{value}</strong> học sinh · {indexValue} điểm
          </div>
        )}
        role="img"
        ariaLabel="Phổ điểm bài kiểm tra"
      />
    </div>
  );
}
