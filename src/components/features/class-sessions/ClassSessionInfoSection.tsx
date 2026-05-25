'use client';

import { Calendar, Clock, FileText, Link as LinkIcon, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/format';
import type { ClassSessionDetail } from '@/types/actions/class-management';

interface Props {
  classSession: ClassSessionDetail;
}

export default function ClassSessionInfoSection({ classSession }: Props) {
  const fields: Array<{
    label: string;
    value: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { label: 'Tiêu đề', value: classSession.title, icon: Tag },
    {
      label: 'Bắt đầu',
      value: formatDateTime(classSession.startTime),
      icon: Calendar,
    },
    {
      label: 'Kết thúc',
      value: formatDateTime(classSession.endTime),
      icon: Clock,
    },
    {
      label: 'Link meeting',
      icon: LinkIcon,
      value: classSession.meetingUrl ? (
        <a
          href={classSession.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple break-all hover:underline"
        >
          {classSession.meetingUrl}
        </a>
      ) : (
        <span className="text-muted-foreground italic">Không có</span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin buổi học</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          {fields.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {label}
                </dt>
                <dd className="text-foreground text-sm font-medium">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="border-divider border-t pt-5">
          <div className="flex items-start gap-3">
            <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Mô tả
              </dt>
              <dd className="text-foreground text-sm">
                {classSession.description ? (
                  <p className="whitespace-pre-wrap">{classSession.description}</p>
                ) : (
                  <span className="text-muted-foreground italic">Không có mô tả</span>
                )}
              </dd>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
