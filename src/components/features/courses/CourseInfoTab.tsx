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
  Pencil,
  Tag,
  Target,
  Users as UsersIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import CourseFormModal from './CourseFormModal';
import type {
  CourseCategoryRow,
  CourseDetail,
  CourseStatus,
} from '@/types/course-management';

function statusBadge(s: CourseStatus) {
  if (s === 'PUBLISHED') return <Badge variant="success">Đang phát hành</Badge>;
  if (s === 'DRAFT') return <Badge variant="warning">Bản nháp</Badge>;
  return <Badge variant="secondary">Đã lưu trữ</Badge>;
}

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
    { label: 'Trạng thái', value: statusBadge(course.status), icon: Activity },
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
    { label: 'Số bài học preview', value: course.previewLessonCount ?? 0, icon: Target },
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Thông tin khóa học</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="cursor-pointer"
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

          {(['description', 'targetAudience', 'learningOutcomes', 'instructorBio'] as const).map(
            (key) => {
              const map: Record<typeof key, string> = {
                description: 'Mô tả',
                targetAudience: 'Đối tượng học viên',
                learningOutcomes: 'Mục tiêu đạt được',
                instructorBio: 'Giới thiệu giảng viên',
              };
              const value = course[key];
              return (
                <div key={key} className="border-divider border-t pt-5">
                  <div className="flex items-start gap-3">
                    <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {map[key]}
                      </dt>
                      <dd className="text-foreground text-sm">
                        {value ? (
                          <p className="whitespace-pre-wrap">{value}</p>
                        ) : (
                          <span className="text-muted-foreground italic">Không có</span>
                        )}
                      </dd>
                    </div>
                  </div>
                </div>
              );
            },
          )}
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
