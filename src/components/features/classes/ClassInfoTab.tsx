'use client';

import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { ClassDetail } from '@/types/actions/classes';
import type { ClassStatus } from '@/types/class-management';

function statusBadge(s: ClassStatus) {
  if (s === 'ACTIVE') return <Badge variant="success">Đang mở</Badge>;
  if (s === 'ARCHIVED') return <Badge variant="warning">Đã đóng</Badge>;
  return <Badge variant="destructive">Đã xoá</Badge>;
}

interface Props {
  classDetail: ClassDetail;
}

export default function ClassInfoTab({ classDetail }: Props) {
  const fields: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'Tên lớp', value: classDetail.name },
    { label: 'Mã lớp', value: <span className="font-mono">{classDetail.code}</span> },
    { label: 'Mô tả', value: classDetail.description || <span className="text-gray-400">—</span> },
    { label: 'Trạng thái', value: statusBadge(classDetail.status) },
    { label: 'Số học sinh', value: classDetail.studentCount },
    { label: 'Ngày tạo', value: formatDate(classDetail.createdAt) },
  ];

  return (
    <div className="border-divider rounded-lg border bg-white p-6">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className="text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
