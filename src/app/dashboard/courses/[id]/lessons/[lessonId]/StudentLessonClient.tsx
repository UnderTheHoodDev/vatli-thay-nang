'use client';

import Link from 'next/link';
import { ArrowLeft, Download, FileText, PlayCircle, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LessonDetail } from '@/types/course-management';

interface Props {
  lesson: LessonDetail;
  courseId: number;
}

export default function StudentLessonClient({ lesson, courseId }: Props) {
  const videoItems = lesson.items.filter((i) => i.type === 'VIDEO');
  const documentItems = lesson.items.filter((i) => i.type === 'DOCUMENT');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground w-fit cursor-pointer pl-1"
        >
          <Link href={`/dashboard/courses/${courseId}`}>
            <ArrowLeft /> Quay lại khóa học
          </Link>
        </Button>
        <nav className="text-muted-foreground text-sm">
          <Link href="/dashboard/courses" className="hover:text-foreground">
            Khóa học
          </Link>
          <span className="mx-1.5">/</span>
          <Link
            href={`/dashboard/courses/${courseId}`}
            className="hover:text-foreground"
          >
            {lesson.course.title}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-muted-foreground">
            Chương {lesson.chapter.order}: {lesson.chapter.title}
          </span>
          <span className="mx-1.5">/</span>
          <span className="text-foreground font-medium">{lesson.title}</span>
        </nav>
        <h1 className="font-paytone text-foreground flex items-center gap-2 text-2xl tracking-tight">
          {lesson.title}
          {lesson.isPreview && (
            <Badge variant="success" className="text-[11px]">
              Preview
            </Badge>
          )}
        </h1>
        {lesson.description && (
          <p className="text-muted-foreground text-sm">{lesson.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="size-5" /> Video bài giảng
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="bg-muted flex aspect-video items-center justify-center rounded-lg">
              <div className="text-muted-foreground space-y-1 text-center">
                <Video className="mx-auto size-10" />
                <p className="text-sm font-medium">Video player sẽ phát triển sau</p>
                <p className="text-xs">
                  {videoItems.length > 0
                    ? `${videoItems.length} video sẽ được hiển thị ở đây`
                    : 'Chưa có video cho bài học này'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nội dung bài học</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {lesson.items.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm italic">
                Bài học chưa có nội dung
              </p>
            ) : (
              <ul className="divide-divider divide-y">
                {lesson.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 py-2.5"
                  >
                    <span
                      className={cn(
                        'bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded',
                        item.type === 'VIDEO' && 'opacity-60',
                      )}
                    >
                      {item.type === 'VIDEO' ? (
                        <Video className="size-4" />
                      ) : (
                        <FileText className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-medium">
                        <span className="text-muted-foreground mr-1.5 text-xs">{item.order}.</span>
                        {item.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.type === 'VIDEO' ? 'Video' : item.fileName ?? 'Tài liệu'}
                      </p>
                    </div>
                    {item.type === 'DOCUMENT' && item.fileUrl && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <a href={item.fileUrl} target="_blank" rel="noreferrer noopener" download>
                          <Download /> Tải xuống
                        </a>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {documentItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" /> Tài liệu đính kèm
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {documentItems.map((doc) => (
                <li
                  key={doc.id}
                  className="border-divider flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">{doc.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {doc.fileName ?? 'Tài liệu'}
                    </p>
                  </div>
                  {doc.fileUrl && (
                    <Button asChild size="sm" variant="outline" className="cursor-pointer">
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer noopener" download>
                        <Download /> Tải
                      </a>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
