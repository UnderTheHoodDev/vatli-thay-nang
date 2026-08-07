'use client';

import type { ReactNode } from 'react';

/** Placeholder chung cho 2 chart xu hướng học phí khi chưa có dữ liệu trong khoảng đang xem. */
export function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">
      {message}
    </div>
  );
}

/** Dòng chú giải màu (chấm + nhãn) — dùng chung cho 2 chart xu hướng học phí. */
export function ChartLegend({
  items,
}: {
  items: Array<{ key: string; color: string; label: string }>;
}) {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      {items.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Khung tooltip chung — cùng style thẻ trắng bo góc đã dùng ở ScoreDistributionChart. */
export function ChartTooltipCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card border-divider rounded border px-3 py-1.5 text-xs shadow-md">
      {children}
    </div>
  );
}
