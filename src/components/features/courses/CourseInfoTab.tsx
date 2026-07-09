'use client';

import { useState } from 'react';
import {
  Activity,
  BookOpen,
  Calendar,
  CalendarClock,
  CalendarRange,
  CircleDollarSign,
  FileText,
  GraduationCap,
  Hash,
  ListChecks,
  Pencil,
  Tag,
  Users as UsersIcon,
} from 'lucide-react';
import CourseStatusBadge from './CourseStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import CourseFormModal from './CourseFormModal';
import type { CourseCategoryRow, CourseDetail } from '@/types/course-management';

function formatVnd(v: number | null | undefined): string {
  if (!v || v <= 0) return 'Miễn phí';
  return `${v.toLocaleString('vi-VN')} đ`;
}

interface Props {
  course: CourseDetail;
  categories: CourseCategoryRow[];
}

export default function CourseInfoTab({ course, categories }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  const fields: Array<{
    label: string;
    value: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { label: 'Tên khóa học', value: course.title, icon: Tag },
    {
      label: 'Mã khóa học',
      icon: Hash,
      value: (
        <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
          {course.code}
        </code>
      ),
    },
    { label: 'Trạng thái', value: <CourseStatusBadge status={course.status} />, icon: Activity },
    { label: 'Danh mục', value: course.category?.name ?? '—', icon: BookOpen },
    {
      label: 'Giảng viên',
      icon: GraduationCap,
      value: course.instructor?.fullName ?? course.instructor?.email ?? '—',
    },
    { label: 'Học phí', value: formatVnd(course.price), icon: CircleDollarSign },
    {
      label: 'Số học sinh',
      icon: UsersIcon,
      value: course.enrollmentCount ?? 0,
    },
    { label: 'Ngày bắt đầu', value: formatDate(course.startDate), icon: Calendar },
    { label: 'Ngày kết thúc', value: formatDate(course.endDate), icon: CalendarRange },
    {
      label: 'Hạn ghi danh',
      value: formatDate(course.enrollmentDeadline),
      icon: CalendarClock,
    },
    { label: 'Ngày tạo', value: formatDate(course.createdAt), icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="min-w-0 truncate">Thông tin khóa học</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="shrink-0 cursor-pointer"
          >
            <Pencil /> Chỉnh sửa
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pb-6">
          {course.thumbnailUrl && (
            <div className="border-divider overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                loading="lazy"
                className="h-56 w-full object-cover"
              />
            </div>
          )}

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

          {(
            [
              { key: 'description', label: 'Mô tả', icon: FileText },
              { key: 'targetAudience', label: 'Đối tượng học viên', icon: UsersIcon },
              { key: 'learningOutcomes', label: 'Mục tiêu đạt được', icon: ListChecks },
              { key: 'instructorBio', label: 'Giới thiệu giảng viên', icon: GraduationCap },
            ] as const
          ).map(({ key, label, icon: Icon }) => {
            const value = course[key];
            const outcomes =
              key === 'learningOutcomes' && value
                ? value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];
            return (
              <div key={key} className="border-divider border-t pt-5">
                <div className="flex items-start gap-3">
                  <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {label}
                    </dt>
                    <dd className="text-foreground text-sm">
                      {!value ? (
                        <span className="text-muted-foreground italic">Không có</span>
                      ) : outcomes.length > 1 ? (
                        <ul className="max-w-prose list-disc space-y-1 pl-5">
                          {outcomes.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="max-w-prose whitespace-pre-wrap">{value}</p>
                      )}
                    </dd>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <CourseFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        categories={categories}
        initialData={course}
      />
    </div>
  );
}
