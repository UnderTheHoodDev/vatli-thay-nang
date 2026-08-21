'use client';

import { Label } from '@/components/ui/label';
import MonthPicker from './MonthPicker';
import { MAX_CHART_MONTHS } from '@/types/actions/tuition';

interface MonthValue {
  year: number;
  month: number;
}

interface Props {
  from: MonthValue;
  to: MonthValue;
  currentYear: number;
  disabled?: boolean;
  onChange: (from: MonthValue, to: MonthValue) => void;
}

function toIndex(v: MonthValue): number {
  return v.year * 12 + (v.month - 1);
}

function fromIndex(idx: number): MonthValue {
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** Kẹp đầu mốc còn lại (`otherIdx`) để khoảng với đầu vừa đổi (`movedIdx`)
 * không vượt MAX_CHART_MONTHS — dùng chung cho cả 2 chiều "Từ tháng"/"Đến tháng". */
function clampOtherEnd(movedIdx: number, otherIdx: number): number {
  const span = Math.abs(otherIdx - movedIdx) + 1;
  if (span <= MAX_CHART_MONTHS) return otherIdx;
  return otherIdx > movedIdx ? movedIdx + MAX_CHART_MONTHS - 1 : movedIdx - MAX_CHART_MONTHS + 1;
}

/**
 * 2 MonthPicker cạnh nhau (tái dùng nguyên component đã có ở trang chi tiết
 * lớp) — tự kẹp khoảng về tối đa MAX_CHART_MONTHS tháng, không chặn bằng lỗi:
 * đổi "Từ tháng" vượt trần thì kéo "Đến tháng" theo, và ngược lại.
 */
export default function TuitionMonthRangeFilter({
  from,
  to,
  currentYear,
  disabled,
  onChange,
}: Props) {
  function handleFromChange(year: number, month: number) {
    const nextFromIdx = toIndex({ year, month });
    if (nextFromIdx > toIndex(to)) {
      onChange({ year, month }, { year, month });
      return;
    }
    onChange({ year, month }, fromIndex(clampOtherEnd(nextFromIdx, toIndex(to))));
  }

  function handleToChange(year: number, month: number) {
    const nextToIdx = toIndex({ year, month });
    if (nextToIdx < toIndex(from)) {
      onChange({ year, month }, { year, month });
      return;
    }
    onChange(fromIndex(clampOtherEnd(nextToIdx, toIndex(from))), { year, month });
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
      <div className="space-y-2">
        <Label>Từ tháng</Label>
        <MonthPicker
          year={from.year}
          month={from.month}
          currentYear={currentYear}
          disabled={disabled}
          onChange={handleFromChange}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline gap-1.5">
          <Label>Đến tháng</Label>
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            (tối đa {MAX_CHART_MONTHS} tháng)
          </span>
        </div>
        <MonthPicker
          year={to.year}
          month={to.month}
          currentYear={currentYear}
          disabled={disabled}
          onChange={handleToChange}
        />
      </div>
    </div>
  );
}
