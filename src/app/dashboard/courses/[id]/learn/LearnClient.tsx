'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  GraduationCap,
  LayoutList,
  Lock,
  RefreshCw,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoPlayer from '@/components/features/courses/VideoPlayer';
import DocumentViewer from '@/components/features/courses/DocumentViewer';
import CourseContentSidebar from '@/components/features/courses/CourseContentSidebar';
import {
  flattenItems,
  nextItem,
  prevItem,
  resolveActive,
  type FlatItem,
} from '@/lib/course-navigation';
import type { CourseDetail } from '@/types/course-management';

interface Props {
  course: CourseDetail;
  initialItemId: number | null;
}

function formatVnd(v: number | null | undefined): string {
  if (!v || v <= 0) return 'Miễn phí';
  return `${v.toLocaleString('vi-VN')} đ`;
}

export default function LearnClient({ course, initialItemId }: Props) {
  const router = useRouter();
  const isEnrolled = course.isEnrolled === true;
  const flat = useMemo(() => flattenItems(course, isEnrolled), [course, isEnrolled]);

  const initialActive = resolveActive(flat, initialItemId);
  const [activeItemId, setActiveItemId] = useState<number | null>(initialActive?.item.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const active = resolveActive(flat, activeItemId);
  const prev = active ? prevItem(flat, active.item.id) : null;
  const next = active ? nextItem(flat, active.item.id) : null;

  function selectItem(itemId: number) {
    setActiveItemId(itemId);
    setSheetOpen(false);
    router.replace(`?item=${itemId}`, { scroll: false });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
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

        {/* Mobile: nút mở sidebar nội dung */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer lg:hidden">
              <LayoutList /> Nội dung
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-[88vw] max-w-sm flex-col p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Nội dung khóa học</SheetTitle>
            </SheetHeader>
            <CourseContentSidebar
              course={course}
              activeItemId={active?.item.id ?? null}
              isEnrolled={isEnrolled}
              onSelect={selectItem}
              variant="sheet"
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* CONTENT trái */}
        <div className="min-w-0 space-y-5">
          <div className="space-y-1">
            <h1 className="font-paytone text-foreground text-xl tracking-tight md:text-2xl">
              {course.title}
            </h1>
            {active && (
              <p className="text-muted-foreground text-sm">
                {active.chapterTitle} · {active.lessonTitle}
                {active.item.title ? ` — ${active.item.title}` : ''}
              </p>
            )}
          </div>

          <ContentArea active={active} />

          {/* Nav prev/next */}
          {active && (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                disabled={!prev}
                onClick={() => prev && selectItem(prev.item.id)}
              >
                <ChevronLeft /> Bài trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                disabled={!next}
                onClick={() => next && selectItem(next.item.id)}
              >
                Bài tiếp <ChevronRight />
              </Button>
            </div>
          )}

          <CourseOverview course={course} />
        </div>

        {/* SIDEBAR phải (desktop) — top dưới topbar (h-16=64px) + gap; height khít viewport */}
        <aside className="hidden lg:sticky lg:top-[76px] lg:block lg:h-[calc(100svh-92px)] lg:overflow-hidden">
          <CourseContentSidebar
            course={course}
            activeItemId={active?.item.id ?? null}
            isEnrolled={isEnrolled}
            onSelect={selectItem}
          />
        </aside>
      </div>
    </div>
  );
}

function ContentArea({ active }: { active: FlatItem | null }) {
  const router = useRouter();

  if (!active) {
    return (
      <Card>
        <CardContent className="flex min-h-[40vh] flex-col items-center justify-center gap-2 py-12 text-center">
          <LayoutList className="text-muted-foreground size-10" />
          <p className="text-foreground text-sm font-medium">Khóa học chưa có nội dung</p>
          <p className="text-muted-foreground text-sm">
            Vui lòng quay lại sau khi giáo viên thêm bài học.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { item, accessible } = active;

  // Item bị khóa (chưa ghi danh & không preview)
  if (!accessible) {
    return (
      <div className="bg-muted flex min-h-[45vh] flex-col items-center justify-center gap-3 rounded-lg text-center">
        <Lock className="text-muted-foreground size-10" />
        <div>
          <p className="text-foreground text-sm font-medium">Nội dung bị khóa</p>
          <p className="text-muted-foreground text-sm">Bạn cần ghi danh khóa học để xem bài này.</p>
        </div>
      </div>
    );
  }

  if (item.type === 'VIDEO') {
    // Video chưa xử lý xong → banner + refresh thủ công (student không auto-poll)
    if (item.bunnyStatus !== 'FINISHED' || !item.videoUrl) {
      const isError = item.bunnyStatus === 'ERROR';
      return (
        <div className="bg-muted flex min-h-[45vh] flex-col items-center justify-center gap-3 rounded-lg text-center">
          <Video className="text-muted-foreground size-10" />
          <div>
            <p className="text-foreground text-sm font-medium">
              {isError ? 'Video xử lý lỗi' : 'Video đang được xử lý'}
            </p>
            <p className="text-muted-foreground text-sm">
              {isError ? 'Vui lòng liên hệ giáo viên.' : 'Quay lại sau ít phút hoặc bấm làm mới.'}
            </p>
          </div>
          {!isError && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => router.refresh()}
            >
              <RefreshCw /> Làm mới
            </Button>
          )}
        </div>
      );
    }
    return (
      <VideoPlayer
        key={item.id}
        lessonItemId={item.id}
        videoUrl={item.videoUrl}
        durationSeconds={item.durationSeconds}
        bunnyStatus={item.bunnyStatus}
        title={item.title}
      />
    );
  }

  // DOCUMENT
  return (
    <DocumentViewer
      key={item.id}
      fileUrl={item.fileUrl}
      fileName={item.fileName}
      mimeType={item.mimeType}
      fileSize={item.fileSize}
      title={item.title}
    />
  );
}

function CourseOverview({ course }: { course: CourseDetail }) {
  return (
    <Tabs defaultValue="overview" className="gap-4 pt-2">
      <TabsList>
        <TabsTrigger value="overview" className="cursor-pointer">
          Tổng quan
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Về khóa học này</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pb-6">
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
            </dl>

            {course.description && (
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {course.description}
              </p>
            )}

            {(
              [
                ['Đối tượng học viên', course.targetAudience],
                ['Mục tiêu đạt được', course.learningOutcomes],
                ['Giới thiệu giảng viên', course.instructorBio],
              ] as const
            ).map(([label, value]) =>
              value ? (
                <div key={label} className="flex items-start gap-3">
                  <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {label}
                    </dt>
                    <dd className="text-foreground text-sm whitespace-pre-wrap">{value}</dd>
                  </div>
                </div>
              ) : null,
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
