'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { shiftMonth } from '@/lib/format';

interface Props {
  year: number;
  month: number; // 1-12
  /** Năm hiện tại theo giờ VN, tính ở RSC. Không tự gọi new Date() ở đây. */
  currentYear: number;
  disabled?: boolean;
  onChange: (year: number, month: number) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** [currentYear-3 .. currentYear+1], luôn chứa `year` đang chọn (URL có thể trỏ về năm cũ). */
function yearOptions(currentYear: number, year: number): number[] {
  const set = new Set<number>([year]);
  for (let y = currentYear - 3; y <= currentYear + 1; y++) set.add(y);
  return Array.from(set).sort((a, b) => b - a);
}

export default function MonthPicker({ year, month, currentYear, disabled, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        title="Tháng trước"
        aria-label="Tháng trước"
        className="cursor-pointer"
        onClick={() => {
          const s = shiftMonth(year, month, -1);
          onChange(s.year, s.month);
        }}
      >
        <ChevronLeft />
      </Button>

      <Select
        value={String(month)}
        disabled={disabled}
        onValueChange={(v) => onChange(year, Number(v))}
      >
        <SelectTrigger className="w-28 cursor-pointer sm:w-32" aria-label="Tháng">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m} value={String(m)}>
              Tháng {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(year)}
        disabled={disabled}
        onValueChange={(v) => onChange(Number(v), month)}
      >
        <SelectTrigger className="w-24 cursor-pointer sm:w-28" aria-label="Năm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions(currentYear, year).map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        title="Tháng sau"
        aria-label="Tháng sau"
        className="cursor-pointer"
        onClick={() => {
          const s = shiftMonth(year, month, 1);
          onChange(s.year, s.month);
        }}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
