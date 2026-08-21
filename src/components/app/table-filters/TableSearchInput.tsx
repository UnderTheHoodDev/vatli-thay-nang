'use client';

import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Đang chờ kết quả (transition) — hiện spinner nhỏ thay icon kính lúp. */
  isPending?: boolean;
  className?: string;
  'aria-label'?: string;
}

/** Ô tìm kiếm gộp của bảng: gõ là lọc (debounce ở hook), có nút xóa nhanh. */
export default function TableSearchInput({
  value,
  onChange,
  placeholder,
  isPending,
  className,
  'aria-label': ariaLabel,
}: Props) {
  return (
    <div className={cn('relative w-full sm:max-w-sm', className)}>
      {isPending ? (
        <Loader2 className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin" />
      ) : (
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="pr-8 pl-9"
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xóa tìm kiếm"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-0.5"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
