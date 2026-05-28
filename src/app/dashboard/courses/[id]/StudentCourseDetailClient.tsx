'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  GraduationCap,
  Info,
  LayoutList,
  Lock,
  PlayCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { CourseDetail } from '@/types/course-management';

function formatVnd(v: number | null | undefined): string {
  if (!v || v <= 0) return 'Miễn phí';
  return `${v.toLocaleString('vi-VN')} đ`;
}

interface Props {
  course: CourseDetail;
}

export default function StudentCourseDetailClient({ course }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(course.chapters.map((c) => c.id)));
  const isEnrolled = course.isEnrolled === true;

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground w-fit cursor-pointer pl-1"
      >
        <Link href="/dashboard/courses">
          <ArrowLeft /> Danh sách khóa học
        </Link>
      </Button>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr]">
          <div className="bg-muted aspect-video md:aspect-auto">
            {course.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                <BookOpen className="size-12" />
              </div>
            )}
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-paytone text-foreground text-2xl tracking-tight">
                  {course.title}
                </h1>
                {isEnrolled && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Đã ghi danh
                  </Badge>
                )}
              </div>
              {course.description && (
                <p className="text-muted-foreground text-sm">{course.description}</p>
              )}
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="text-muted-foreground size-4" />
                <span className="text-muted-foreground">Giảng viên:</span>
                <span className="text-foreground font-medium">
                  {course.instructor?.fullName ?? course.instructor?.email ?? '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CircleDollarSign className="text-muted-foreground size-4" />
                <span className="text-muted-foreground">Học phí:</span>
                <span className="text-primary font-semibold">{formatVnd(course.price)}</span>
              </div>
              <div className="flex items-center gap-2">
                <LayoutList className="text-muted-foreground size-4" />
                <span className="text-muted-foreground">Nội dung:</span>
                <span className="text-foreground font-medium">
                  {course.totalChapters ?? 0} chương · {course.totalLessons ?? 0} bài
                </span>
              </div>
              {course.startDate && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Bắt đầu:</span>
                  <span className="text-foreground font-medium">{formatDate(course.startDate)}</span>
                </div>
              )}
            </dl>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="info" className="gap-4">
        <TabsList>
          <TabsTrigger value="info" className="cursor-pointer">
            <Info className="size-4" /> Thông tin
          </TabsTrigger>
          <TabsTrigger value="structure" className="cursor-pointer">
            <LayoutList className="size-4" /> Nội dung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin khóa học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              {(
                [
                  ['Đối tượng học viên', course.targetAudience],
                  ['Mục tiêu đạt được', course.learningOutcomes],
                  ['Giới thiệu giảng viên', course.instructorBio],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {label}
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
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <CardTitle>Nội dung khóa học</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {isEnrolled
                  ? 'Nhấn vào bài học để bắt đầu học.'
                  : 'Bạn có thể xem các bài học preview. Ghi danh để mở khoá toàn bộ nội dung.'}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 pb-6">
              {course.chapters.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm italic">
                  Khóa học chưa có nội dung.
                </p>
              ) : (
                <ul className="space-y-2">
                  {course.chapters.map((chapter) => {
                    const open = expanded.has(chapter.id);
                    return (
                      <li
                        key={chapter.id}
                        className="border-divider overflow-hidden rounded-lg border"
                      >
                        <button
                          type="button"
                          onClick={() => toggle(chapter.id)}
                          className="bg-muted/30 hover:bg-muted/50 flex w-full items-center gap-2 px-4 py-3 text-left transition"
                        >
                          {open ? (
                            <ChevronDown className="text-muted-foreground size-4" />
                          ) : (
                            <ChevronRight className="text-muted-foreground size-4" />
                          )}
                          <span className="text-foreground flex-1 font-medium">
                            <span className="text-muted-foreground mr-1.5 text-xs">
                              Chương {chapter.order}.
                            </span>
                            {chapter.title}
                          </span>
                          <Badge variant="secondary">{chapter.lessons.length} bài</Badge>
                        </button>
                        {open && (
                          <ul className="divide-divider divide-y">
                            {chapter.lessons.length === 0 ? (
                              <li className="text-muted-foreground px-4 py-3 text-sm italic">
                                Chưa có bài học
                              </li>
                            ) : (
                              chapter.lessons.map((lesson) => {
                                const canAccess = isEnrolled || lesson.isPreview;
                                const content = (
                                  <span
                                    className={cn(
                                      'flex items-center gap-3 px-4 py-2.5 text-sm transition',
                                      canAccess
                                        ? 'hover:bg-muted cursor-pointer'
                                        : 'text-muted-foreground cursor-not-allowed',
                                    )}
                                  >
                                    {canAccess ? (
                                      <PlayCircle className="text-primary size-4" />
                                    ) : (
                                      <Lock className="size-4" />
                                    )}
                                    <span className="flex-1 truncate">
                                      <span className="text-muted-foreground mr-1.5 text-xs">
                                        {lesson.order}.
                                      </span>
                                      {lesson.title}
                                    </span>
                                    {lesson.isPreview && (
                                      <Badge
                                        variant="success"
                                        className="px-1.5 py-0 text-[10px]"
                                      >
                                        Preview
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                      {lesson.itemCount} mục
                                    </Badge>
                                    {canAccess && (
                                      <ArrowRight className="text-muted-foreground size-4" />
                                    )}
                                  </span>
                                );
                                return (
                                  <li key={lesson.id}>
                                    {canAccess ? (
                                      <Link
                                        href={`/dashboard/courses/${course.id}/lessons/${lesson.id}`}
                                      >
                                        {content}
                                      </Link>
                                    ) : (
                                      content
                                    )}
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
