'use client';

import { type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  /** Số bộ lọc nâng cao đang bật — hiện badge đếm trên nút. */
  activeCount: number;
  /** Nội dung popover: các ô lọc ít dùng của từng trang. */
  children: ReactNode;
  className?: string;
}

/**
 * Nút "Bộ lọc" gom các ô ít dùng (tỉnh, khoảng ngày…) vào popover — bảng chỉ
 * còn ô tìm kiếm gộp + lọc ngay trên cột, không còn form 9 ô chiếm nửa màn hình.
 */
export default function AdvancedFiltersButton({ activeCount, children, className }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className ?? 'cursor-pointer'}>
          <SlidersHorizontal />
          Bộ lọc
          {activeCount > 0 && (
            <Badge className="bg-purple ml-0.5 size-5 justify-center rounded-full p-0 text-[11px] text-white">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4 p-4">
        {children}
      </PopoverContent>
    </Popover>
  );
}
