'use client';

import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TuitionExportDialog from './TuitionExportDialog';
import TuitionImportDialog from './TuitionImportDialog';
import type { ClassRow } from '@/types/class-management';

interface Props {
  classId?: number;
  selectedClass?: ClassRow;
  year: number;
  month: number;
}

/**
 * Xuất/nhập Excel luôn thao tác trên đúng 1 lớp — khác các khối khác trên
 * trang (chart, bảng danh sách) vốn xem được nhiều/tất cả lớp cùng lúc. Chỉ
 * mở khoá khi bộ lọc "Lớp" đã chọn đúng 1 lớp cụ thể (không phải "Tất cả các
 * lớp"). `year`/`month` lấy theo tháng đang xem ở bảng "Danh sách các lớp".
 */
export default function TuitionClassExcelCard({ classId, selectedClass, year, month }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="text-muted-foreground size-4 shrink-0" />
        <p className="text-muted-foreground text-sm">
          {classId && selectedClass ? (
            <>
              Xuất/nhập Excel cho lớp{' '}
              <span className="text-foreground font-medium">{selectedClass.code}</span> — tháng{' '}
              {month}/{year}
            </>
          ) : (
            'Chọn một lớp cụ thể để bật xuất/nhập học phí Excel.'
          )}
        </p>
      </div>
      {classId ? (
        <div className="flex flex-wrap items-center gap-2">
          <TuitionExportDialog classId={classId} year={year} month={month} />
          <TuitionImportDialog classId={classId} year={year} month={month} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled className="cursor-not-allowed">
            <Download /> Xuất Excel
          </Button>
          <Button variant="outline" disabled className="cursor-not-allowed">
            <Upload /> Nhập Excel
          </Button>
        </div>
      )}
    </div>
  );
}
