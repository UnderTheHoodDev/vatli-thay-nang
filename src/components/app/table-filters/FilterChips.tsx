'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface FilterChip {
  key: string;
  /** "Vai trò: Học sinh" — trang tự dựng nhãn dễ đọc. */
  label: string;
}

interface Props {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

/** Dải chip các bộ lọc đang bật — thấy ngay đang lọc gì và gỡ từng cái một chạm. */
export default function FilterChips({ chips, onRemove, onClearAll }: Props) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <Badge key={c.key} variant="secondary" className="gap-1 pr-1 font-normal">
          {c.label}
          <button
            type="button"
            onClick={() => onRemove(c.key)}
            aria-label={`Bỏ lọc ${c.label}`}
            className="hover:bg-muted-foreground/20 cursor-pointer rounded-full p-0.5"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground h-6 cursor-pointer px-2 text-xs"
        >
          Xóa tất cả
        </Button>
      )}
    </div>
  );
}
