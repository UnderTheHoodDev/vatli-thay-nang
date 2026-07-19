'use client';

import { ResponsiveBar } from '@nivo/bar';
import type { ScoreBin } from '@/types/tests';

interface Props {
  distribution: ScoreBin[];
  /** Điểm của chính mình — đánh dấu cột chứa nó (dùng ở màn học sinh). */
  highlightScore?: number | null;
  /** Điểm trung bình lớp — đánh dấu cột chứa nó (dùng ở màn admin). */
  avgScore?: number | null;
  maxScore: number;
}

type BinFlag = 'mine' | 'avg' | 'none';

/** nivo đòi datum có index signature và giá trị chỉ string|number (không boolean). */
interface ScoreBarDatum {
  [key: string]: string | number;
  range: string;
  count: number;
}

const COLOR: Record<BinFlag, string> = {
  mine: '#723bcf',
  avg: '#f0c040',
  none: '#c4b5fd',
};

/** Điểm tuyệt đối rơi vào bin cuối (BE kẹp như vậy), nên bin cuối phải bao gồm cả `to`. */
function inBin(score: number, b: ScoreBin, maxScore: number): boolean {
  return score >= b.from && (score < b.to || (b.to === maxScore && score === maxScore));
}

/**
 * Phổ điểm: chia [0, maxScore] thành 10 bin đều, trục Y là SỐ HỌC SINH.
 * BE đã dựng sẵn bin (kể cả bin count = 0) nên FE không tự chia lại.
 */
export default function ScoreDistributionChart({
  distribution,
  highlightScore,
  avgScore,
  maxScore,
}: Props) {
  const flags = new Map<string, BinFlag>(
    distribution.map((b) => {
      const range = `${b.from}–${b.to}`;
      if (highlightScore != null && inBin(highlightScore, b, maxScore)) return [range, 'mine'];
      if (avgScore != null && inBin(avgScore, b, maxScore)) return [range, 'avg'];
      return [range, 'none'];
    }),
  );
  const data: ScoreBarDatum[] = distribution.map((b) => ({
    range: `${b.from}–${b.to}`,
    count: b.count,
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
    <div className="space-y-2">
      {/* nivo cần cha có chiều cao cố định. */}
      <div className="h-[260px] w-full">
        <ResponsiveBar
          data={data}
          keys={['count']}
          indexBy="range"
          margin={{ top: 10, right: 10, bottom: 48, left: 40 }}
          padding={0.25}
          colors={({ indexValue }) => COLOR[flags.get(String(indexValue)) ?? 'none']}
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

      {(highlightScore != null || avgScore != null) && (
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {highlightScore != null && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ backgroundColor: COLOR.mine }}
                aria-hidden
              />
              Điểm của bạn
            </span>
          )}
          {avgScore != null && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-2.5 rounded-sm"
                style={{ backgroundColor: COLOR.avg }}
                aria-hidden
              />
              Điểm trung bình lớp
            </span>
          )}
        </div>
      )}
    </div>
  );
}
