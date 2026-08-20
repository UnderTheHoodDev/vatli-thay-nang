'use client';

import { useState } from 'react';
import { Check, ListFilter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TableHead } from '@/components/ui/table';
import { ALL_VALUE } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface ColumnFilterOption {
  value: string;
  label: string;
}

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
  const [open, setOpen] = useState(false);
  const active = value !== ALL_VALUE && value !== '';
  const items = [{ value: ALL_VALUE, label: allLabel }, ...options];

  return (
    <TableHead className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Lọc theo ${label.toLowerCase()}`}
            className={cn(
              'hover:text-foreground -mx-1 inline-flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 whitespace-nowrap transition-colors',
              active && 'text-purple font-semibold',
            )}
          >
            {label}
            <ListFilter
              className={cn('size-3.5 shrink-0', active ? 'text-purple' : 'opacity-40')}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-1">
          <ul role="listbox" aria-label={`Lọc theo ${label.toLowerCase()}`}>
            {items.map((opt) => {
              const selected = opt.value === value || (opt.value === ALL_VALUE && !active);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'hover:bg-accent flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                      selected && 'font-medium',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {selected && <Check className="text-purple size-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </TableHead>
  );
}
