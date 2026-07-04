import DataPagination from './DataPagination';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Footer phân trang dùng chung cho các bảng (Trang x / y + DataPagination).
 * Tự ẩn khi chỉ có 1 trang.
 */
export default function TablePagerFooter({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
      <div className="text-muted-foreground text-sm">
        Trang {page} / {totalPages}
      </div>
      <DataPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
