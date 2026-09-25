'use client';

import { ArrowDownNarrowWide, ArrowUpDown, ArrowUpNarrowWide } from 'lucide-react';
import ColumnHeadMenu, { type ColumnHeadMenuItem } from './ColumnHeadMenu';
import type { SortOrder } from '@/types/auth';

export interface ColumnSortOption<V extends string> extends ColumnHeadMenuItem {
  value: V;
}

const UNSORTED = '';

interface Props<V extends string> {
  label: string;
  /** Chỉ số đang sắp xếp; '' = giữ thứ tự mặc định. */
  value: V | '';
  order: SortOrder;
  options: ColumnSortOption<V>[];
  onChange: (value: V | '', order: SortOrder) => void;
  className?: string;
}

/**
 * Ô tiêu đề cột kèm dropdown sắp xếp — dùng khi một cột gộp nhiều chỉ số
 * (vd. Chuyên cần). Bấm lại chỉ số đang chọn để đảo chiều.
 */
export default function ColumnSortHead<V extends string>({
  label,
  value,
  order,
  options,
  onChange,
  className,
}: Props<V>) {
  const active = options.find((o) => o.value === value);
  const OrderIcon = order === 'asc' ? ArrowUpNarrowWide : ArrowDownNarrowWide;

  function pick(picked: string) {
    const next = picked as V | '';
    if (next === UNSORTED) {
      // Đã không sắp xếp -> bấm lại là no-op, đừng đẩy URL cho một thay đổi rỗng.
      if (active) onChange(UNSORTED, 'desc');
      return;
    }
    onChange(next, next === value && order === 'desc' ? 'asc' : 'desc');
  }

  return (
    <ColumnHeadMenu
      label={label}
      ariaLabel={`Sắp xếp theo ${label.toLowerCase()}`}
      active={!!active}
      triggerIcon={active ? OrderIcon : ArrowUpDown}
      activeSuffix={active?.label}
      items={[{ value: UNSORTED, label: 'Không sắp xếp' }, ...options]}
      selectedValue={active ? value : UNSORTED}
      selectedIcon={OrderIcon}
      onPick={pick}
      footer={
        <p className="text-muted-foreground px-2 py-1.5 text-xs">
          Bấm lại chỉ số đang chọn để đảo chiều.
        </p>
      }
      className={className}
      contentClassName="w-56"
    />
  );
}
