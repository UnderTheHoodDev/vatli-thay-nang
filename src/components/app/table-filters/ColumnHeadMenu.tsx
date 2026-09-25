'use client';

import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface ColumnHeadMenuItem {
  value: string;
  label: string;
}

interface Props {
  label: string;
  /** Mô tả cho screen reader, vd. "Lọc theo nhóm". */
  ariaLabel: string;
  /** true = cột đang lọc/đang sắp xếp — tô màu tiêu đề. */
  active: boolean;
  triggerIcon: LucideIcon;
  /** Nhãn phụ cạnh tiêu đề khi active, vd. tên chỉ số đang sắp xếp. */
  activeSuffix?: string;
  items: ColumnHeadMenuItem[];
  selectedValue: string;
  /** Icon đánh dấu dòng đang chọn. */
  selectedIcon: LucideIcon;
  onPick: (value: string) => void;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Khung chung cho các ô tiêu đề cột có dropdown (lọc, sắp xếp) — giữ markup,
 * class và a11y ở một chỗ để hai biến thể không trôi khỏi nhau.
 */
export default function ColumnHeadMenu({
  label,
  ariaLabel,
  active,
  triggerIcon: TriggerIcon,
  activeSuffix,
  items,
  selectedValue,
  selectedIcon: SelectedIcon,
  onPick,
  footer,
  className,
  contentClassName = 'w-48',
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <TableHead className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={ariaLabel}
            className={cn(
              'hover:text-foreground -mx-1 inline-flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 whitespace-nowrap transition-colors',
              active && 'text-purple font-semibold',
            )}
          >
            {label}
            {active && activeSuffix && (
              <span className="text-xs font-normal">· {activeSuffix}</span>
            )}
            <TriggerIcon
              className={cn('size-3.5 shrink-0', active ? 'text-purple' : 'opacity-40')}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className={cn('p-1', contentClassName)}>
          <ul role="listbox" aria-label={ariaLabel}>
            {items.map((item) => {
              const selected = item.value === selectedValue;
              return (
                <li key={item.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onPick(item.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'hover:bg-accent flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                      selected && 'font-medium',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {selected && <SelectedIcon className="text-purple size-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {footer}
        </PopoverContent>
      </Popover>
    </TableHead>
  );
}
