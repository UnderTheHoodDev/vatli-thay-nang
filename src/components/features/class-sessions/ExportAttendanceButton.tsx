'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportAttendanceSummaryAction } from '@/actions/v1/attendance/export-attendance-summary';

interface Props {
  classSessionId: number;
}

export default function ExportAttendanceButton({ classSessionId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await exportAttendanceSummaryAction(classSessionId);
      if (result.errors.length > 0) {
        toast.error(result.errors[0]);
        return;
      }
      if (!result.blob) return;

      const url = URL.createObjectURL(result.blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
      toast.success('Xuất báo cáo thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <Download className="mr-1.5 size-4" />
      {loading ? 'Đang xuất...' : 'Xuất Excel'}
    </Button>
  );
}
