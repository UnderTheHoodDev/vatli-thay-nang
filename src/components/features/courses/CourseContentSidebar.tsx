'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Lock,
  PlayCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BUNNY_STATUS_META } from '@/types/course-management';
import type { CourseDetail, LessonItemTree } from '@/types/course-management';

interface Props {
  course: CourseDetail;
  activeItemId: number | null;
  isEnrolled: boolean;
  onSelect: (itemId: number) => void;
  variant?: 'panel' | 'sheet';
}

export default function CourseContentSidebar({
  course,
  activeItemId,
  isEnrolled,
  onSelect,
  variant = 'panel',
}: Props) {
  // Mặc định mở chương chứa item đang active (hoặc tất cả nếu chưa có).
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(course.chapters.map((c) => c.id)),
  );

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className={cn(
        'border-divider bg-background flex h-full flex-col overflow-hidden rounded-lg border',
        variant === 'sheet' && 'border-0',
      )}
    >
      {/* Header pinned — luôn cố định trên cùng, không cuộn theo list */}
      <div className="border-divider bg-muted/40 shrink-0 border-b px-4 py-3">
        <p className="text-foreground text-sm font-semibold">Nội dung khóa học</p>
        <p className="text-muted-foreground text-xs">
          {course.totalChapters ?? course.chapters.length} chương ·{' '}
          {course.totalLessons ?? 0} bài
        </p>
      </div>

      {/* Chỉ phần list cuộn */}
      <div className="min-h-0 flex-1 overflow-y-auto">
      {course.chapters.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-center text-sm italic">
          Khóa học chưa có nội dung.
        </p>
      ) : (
        <ul className="divide-divider divide-y">
          {course.chapters.map((chapter) => {
            const open = expanded.has(chapter.id);
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  onClick={() => toggle(chapter.id)}
                  className="bg-muted/20 hover:bg-muted/40 flex w-full items-center gap-2 px-4 py-2.5 text-left transition"
                >
                  {open ? (
                    <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                  ) : (
                    <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                  )}
                  <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                    <span className="text-muted-foreground mr-1 text-xs">
                      C{chapter.order}.
                    </span>
                    {chapter.title}
                  </span>
                </button>

                {open && (
                  <ul>
                    {chapter.lessons.map((lesson) => {
                      const accessible = isEnrolled || lesson.isPreview;
                      return (
                        <li key={lesson.id}>
                          <div className="text-muted-foreground bg-muted/5 flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium">
                            <span className="truncate">
                              {lesson.order}. {lesson.title}
                            </span>
                            {lesson.isPreview && (
                              <Badge
                                variant="success"
                                className="px-1 py-0 text-[9px]"
                              >
                                Miễn phí
                              </Badge>
                            )}
                          </div>
                          <ul>
                            {lesson.items.map((item) => (
                              <ItemEntry
                                key={item.id}
                                item={item}
                                accessible={accessible}
                                active={item.id === activeItemId}
                                onSelect={() => onSelect(item.id)}
                              />
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      </div>
    </div>
  );
}

function ItemEntry({
  item,
  accessible,
  active,
  onSelect,
}: {
  item: LessonItemTree;
  accessible: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const isVideo = item.type === 'VIDEO';
  const statusMeta =
    isVideo && item.bunnyStatus
      ? (BUNNY_STATUS_META[item.bunnyStatus] ?? BUNNY_STATUS_META.ERROR)
      : null;
  const showProcessing = isVideo && statusMeta?.pending;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-2 py-2 pr-3 pl-9 text-left text-sm transition',
          active
            ? 'bg-purple/10 text-purple font-medium'
            : 'hover:bg-muted text-foreground',
        )}
      >
        {!accessible ? (
          <Lock className="text-muted-foreground size-3.5 shrink-0" />
        ) : isVideo ? (
          <PlayCircle
            className={cn('size-3.5 shrink-0', active ? 'text-purple' : 'text-muted-foreground')}
          />
        ) : (
          <FileText
            className={cn('size-3.5 shrink-0', active ? 'text-purple' : 'text-muted-foreground')}
          />
        )}
        <span className="min-w-0 flex-1 truncate">{item.title}</span>
        {showProcessing && (
          <Badge variant={statusMeta!.variant} className="px-1 py-0 text-[9px]">
            {item.bunnyStatus === 'QUEUED' ? 'Chờ' : 'Xử lý'}
          </Badge>
        )}
      </button>
    </li>
  );
}
