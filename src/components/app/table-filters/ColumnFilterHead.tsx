'use client';

import { Check, ListFilter } from 'lucide-react';
import { ALL_VALUE } from '@/lib/constants';
import ColumnHeadMenu, { type ColumnHeadMenuItem } from './ColumnHeadMenu';

export type ColumnFilterOption = ColumnHeadMenuItem;

interface Props {
  label: string;
  /** Giá trị đang lọc; ALL_VALUE = không lọc. */
  value: string;
  options: ColumnFilterOption[];
  onChange: (value: string) => void;
  /** Nhãn dòng "không lọc" — mặc định "Tất cả". */
  allLabel?: string;
  className?: string;
}

/**
 * Ô tiêu đề cột kèm dropdown lọc — thay cho ô select rời trong form Bộ lọc.
 * Icon phễu đổi màu khi đang lọc để quét nhanh cột nào đang thu hẹp dữ liệu.
 */
export default function ColumnFilterHead({
  label,
  value,
  options,
  onChange,
  allLabel = 'Tất cả',
  className,
}: Props) {
  const active = value !== ALL_VALUE && value !== '';

  return (
    <ColumnHeadMenu
      label={label}
      ariaLabel={`Lọc theo ${label.toLowerCase()}`}
      active={active}
      triggerIcon={ListFilter}
      items={[{ value: ALL_VALUE, label: allLabel }, ...options]}
      selectedValue={active ? value : ALL_VALUE}
      selectedIcon={Check}
      onPick={onChange}
      className={className}
    />
  );
}
