'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
  Layers,
  ListChecks,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  PlusCircle,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EmptyState from '@/components/app/EmptyState';
import { cn } from '@/lib/utils';
import { handleActionResult, handleActionErrors } from '@/lib/actions';
import { useUploadManager } from './UploadManagerProvider';
import { getBunnyTusUploadAction } from '@/actions/v1/bunny/get-tus-upload';
import { reorderChaptersAction } from '@/actions/v1/chapters/reorder-chapters';
import { reorderLessonsAction } from '@/actions/v1/lessons/reorder-lessons';
import { reorderLessonItemsAction } from '@/actions/v1/lesson-items/reorder-lesson-items';
import { deleteChapterAction } from '@/actions/v1/chapters/delete-chapter';
import { deleteLessonAction } from '@/actions/v1/lessons/delete-lesson';
import { deleteLessonItemAction } from '@/actions/v1/lesson-items/delete-lesson-item';
import { getCourseVideoStatusAction } from '@/actions/v1/courses/get-video-status';
import ChapterFormModal from './ChapterFormModal';
import LessonFormModal from './LessonFormModal';
import LessonItemFormModal from './LessonItemFormModal';
import {
  BUNNY_STATUS_META,
  type BunnyVideoStatus,
  type ChapterTree,
  type CourseDetail,
  type LessonItemTree,
  type LessonTree,
} from '@/types/course-management';

interface VideoStatusInfo {
  bunnyStatus: BunnyVideoStatus;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
}

const POLL_INTERVAL_MS = 9000;

const PENDING_STATUSES: BunnyVideoStatus[] = ['UPLOADING', 'QUEUED', 'PROCESSING'];

function isPendingVideo(i: LessonItemTree): boolean {
  return i.type === 'VIDEO' && PENDING_STATUSES.includes(i.bunnyStatus);
}

function hasPendingVideo(chapters: ChapterTree[]): boolean {
  return chapters.some((c) => c.lessons.some((l) => l.items.some(isPendingVideo)));
}

function mergeStatus(
  chapters: ChapterTree[],
  statusMap: Record<number, VideoStatusInfo>,
): ChapterTree[] {
  if (Object.keys(statusMap).length === 0) return chapters;
  return chapters.map((c) => ({
    ...c,
    lessons: c.lessons.map((l) => ({
      ...l,
      items: l.items.map((i) => {
        const s = statusMap[i.id];
        return s
          ? {
              ...i,
              bunnyStatus: s.bunnyStatus,
              durationSeconds: s.durationSeconds ?? i.durationSeconds,
              thumbnailUrl: s.thumbnailUrl ?? i.thumbnailUrl,
            }
          : i;
      }),
    })),
  }));
}

interface Props {
  course: CourseDetail;
}

type DeleteTarget =
  | { kind: 'chapter'; id: number; title: string }
  | { kind: 'lesson'; id: number; title: string }
  | { kind: 'item'; id: number; title: string };

export default function CourseStructureTab({ course }: Props) {
  const router = useRouter();
  const [chapters, setChapters] = useState<ChapterTree[]>(course.chapters);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();

  // Sync local state when parent re-renders after revalidatePath + router.refresh().
  // Without this, optimistic drag-drop state would shadow updates coming from the server.
  useEffect(() => {
    setChapters(course.chapters);
    setStatusMap({});
  }, [course.chapters]);

  // Trạng thái xử lý video poll được (override bunnyStatus của cây).
  const [statusMap, setStatusMap] = useState<Record<number, VideoStatusInfo>>({});
  const displayChapters = useMemo(() => mergeStatus(chapters, statusMap), [chapters, statusMap]);
  const pendingCount = useMemo(
    () =>
      displayChapters.reduce(
        (sum, c) => sum + c.lessons.reduce((s, l) => s + l.items.filter(isPendingVideo).length, 0),
        0,
      ),
    [displayChapters],
  );

  // Auto-poll batch trạng thái video CHỈ khi còn item chưa xử lý xong.
  // Dep là boolean `shouldPoll` (primitive) — KHÔNG phụ thuộc object displayChapters
  // để tránh re-subscribe vô hạn mỗi lần setStatusMap tạo object mới.
  const shouldPoll = useMemo(() => hasPendingVideo(displayChapters), [displayChapters]);
  const refreshedOnSettle = useRef(false);
  useEffect(() => {
    if (!shouldPoll) return;
    let cancelled = false;
    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const res = await getCourseVideoStatusAction(course.id);
      if (cancelled || !res.data) return;
      setStatusMap((prev) => {
        const next = { ...prev };
        for (const it of res.data!.items) {
          next[it.lessonItemId] = {
            bunnyStatus: it.bunnyStatus,
            durationSeconds: it.durationSeconds,
            thumbnailUrl: it.thumbnailUrl,
          };
        }
        return next;
      });
      // Khi tất cả đã settled → refresh 1 lần để server-render khớp dữ liệu.
      if (res.data.allSettled && !refreshedOnSettle.current) {
        refreshedOnSettle.current = true;
        router.refresh();
      }
    };
    void tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      // Reset để chu kỳ poll sau (video mới upload) lại có thể refresh khi allSettled.
      refreshedOnSettle.current = false;
    };
  }, [shouldPoll, course.id, router]);

  const [chapterModal, setChapterModal] = useState<{
    mode: 'create' | 'edit';
    data?: ChapterTree;
  } | null>(null);
  const [lessonModal, setLessonModal] = useState<{
    mode: 'create' | 'edit';
    chapterId: number;
    data?: LessonTree;
  } | null>(null);
  const [itemModal, setItemModal] = useState<{
    mode: 'create' | 'edit';
    lessonId: number;
    data?: LessonItemTree;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function toggleChapter(id: number) {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleLesson(id: number) {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleChapterDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(chapters, oldIndex, newIndex);
    setChapters(next);
    const payload = {
      items: next.map((c, i) => ({ id: c.id, order: i + 1 })),
    };
    startTransition(async () => {
      const res = await reorderChaptersAction(course.id, payload);
      if (res.errors.length) {
        handleActionResult(res.errors);
        router.refresh();
      }
    });
  }

  function handleLessonDragEnd(chapterId: number, e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    const oldIndex = chapter.lessons.findIndex((l) => l.id === active.id);
    const newIndex = chapter.lessons.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextLessons = arrayMove(chapter.lessons, oldIndex, newIndex);
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, lessons: nextLessons } : c)),
    );
    const payload = {
      items: nextLessons.map((l, i) => ({ id: l.id, order: i + 1 })),
    };
    startTransition(async () => {
      const res = await reorderLessonsAction(chapterId, course.id, payload);
      if (res.errors.length) {
        handleActionResult(res.errors);
        router.refresh();
      }
    });
  }

  function handleItemDragEnd(lessonId: number, chapterId: number, e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const chapter = chapters.find((c) => c.id === chapterId);
    const lesson = chapter?.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    const oldIndex = lesson.items.findIndex((i) => i.id === active.id);
    const newIndex = lesson.items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextItems = arrayMove(lesson.items, oldIndex, newIndex);
    setChapters((prev) =>
      prev.map((c) =>
        c.id !== chapterId
          ? c
          : {
              ...c,
              lessons: c.lessons.map((l) => (l.id === lessonId ? { ...l, items: nextItems } : l)),
            },
      ),
    );
    const payload = {
      items: nextItems.map((i, idx) => ({ id: i.id, order: idx + 1 })),
    };
    startTransition(async () => {
      const res = await reorderLessonItemsAction(lessonId, course.id, payload);
      if (res.errors.length) {
        handleActionResult(res.errors);
        router.refresh();
      }
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      let res;
      if (deleteTarget.kind === 'chapter') {
        res = await deleteChapterAction(deleteTarget.id, course.id);
      } else if (deleteTarget.kind === 'lesson') {
        res = await deleteLessonAction(deleteTarget.id, course.id);
      } else {
        res = await deleteLessonItemAction(deleteTarget.id, course.id);
      }
      const ok = handleActionResult(res.errors, () => router.refresh(), 'Xoá thành công');
      if (ok) setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Nội dung khóa học</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Kéo thả để sắp xếp lại thứ tự. Mỗi cấp chỉ kéo thả trong cùng cấp đó.
            </p>
          </div>
          <Button onClick={() => setChapterModal({ mode: 'create' })} className="cursor-pointer">
            <Plus /> Thêm chương
          </Button>
        </CardHeader>
        {pendingCount > 0 && (
          <div className="border-divider mx-6 mb-2 flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <Loader2 className="size-4 animate-spin" />
            {pendingCount} video đang tải lên / xử lý — trạng thái sẽ tự cập nhật khi hoàn tất.
          </div>
        )}
        <CardContent className="pb-6">
          {displayChapters.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Chưa có chương nào"
              description="Tạo chương đầu tiên để bắt đầu xây dựng nội dung khóa học."
              action={
                <Button
                  onClick={() => setChapterModal({ mode: 'create' })}
                  className="cursor-pointer"
                >
                  <Plus /> Thêm chương
                </Button>
              }
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleChapterDragEnd}
            >
              <SortableContext
                items={displayChapters.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {displayChapters.map((chapter) => (
                    <ChapterRow
                      key={chapter.id}
                      chapter={chapter}
                      courseId={course.id}
                      expanded={expandedChapters.has(chapter.id)}
                      onToggle={() => toggleChapter(chapter.id)}
                      onEdit={() => setChapterModal({ mode: 'edit', data: chapter })}
                      onDelete={() =>
                        setDeleteTarget({
                          kind: 'chapter',
                          id: chapter.id,
                          title: chapter.title,
                        })
                      }
                      onAddLesson={() => setLessonModal({ mode: 'create', chapterId: chapter.id })}
                      expandedLessons={expandedLessons}
                      onToggleLesson={toggleLesson}
                      onEditLesson={(lesson) =>
                        setLessonModal({
                          mode: 'edit',
                          chapterId: chapter.id,
                          data: lesson,
                        })
                      }
                      onDeleteLesson={(lesson) =>
                        setDeleteTarget({
                          kind: 'lesson',
                          id: lesson.id,
                          title: lesson.title,
                        })
                      }
                      onAddItem={(lessonId) => setItemModal({ mode: 'create', lessonId })}
                      onEditItem={(item, lessonId) =>
                        setItemModal({ mode: 'edit', lessonId, data: item })
                      }
                      onDeleteItem={(item) =>
                        setDeleteTarget({
                          kind: 'item',
                          id: item.id,
                          title: item.title,
                        })
                      }
                      onLessonDragEnd={handleLessonDragEnd}
                      onItemDragEnd={handleItemDragEnd}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {chapterModal && (
        <ChapterFormModal
          open={!!chapterModal}
          onOpenChange={(open) => !open && setChapterModal(null)}
          mode={chapterModal.mode}
          courseId={course.id}
          initialData={chapterModal.data}
        />
      )}

      {lessonModal && (
        <LessonFormModal
          open={!!lessonModal}
          onOpenChange={(open) => !open && setLessonModal(null)}
          mode={lessonModal.mode}
          courseId={course.id}
          chapterId={lessonModal.chapterId}
          initialData={lessonModal.data}
        />
      )}

      {itemModal && (
        <LessonItemFormModal
          open={!!itemModal}
          onOpenChange={(open) => !open && setItemModal(null)}
          mode={itemModal.mode}
          courseId={course.id}
          lessonId={itemModal.lessonId}
          initialData={itemModal.data}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === 'chapter' && 'Bạn có chắc muốn xoá chương '}
              {deleteTarget?.kind === 'lesson' && 'Bạn có chắc muốn xoá bài học '}
              {deleteTarget?.kind === 'item' && 'Bạn có chắc muốn xoá mục '}
              <span className="text-foreground font-medium">{deleteTarget?.title}</span>? Toàn bộ
              nội dung con (nếu có) cũng sẽ bị xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? 'Đang xoá...' : 'Xoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Kebab menu gom Sửa/Xoá — gọn hàng ngang để tiêu đề luôn hiển thị (đặc biệt mobile).
function RowActions({
  onEdit,
  onDelete,
  size = 'sm',
}: {
  onEdit: () => void;
  onDelete: () => void;
  size?: 'sm' | 'xs';
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'xs' ? 'icon-xs' : 'icon-sm'}
          title="Thao tác"
          className="cursor-pointer"
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
          <Pencil className="size-4" /> Sửa
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={onDelete}
        >
          <Trash2 className="size-4" /> Xoá
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ChapterRowProps {
  chapter: ChapterTree;
  courseId: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  expandedLessons: Set<number>;
  onToggleLesson: (id: number) => void;
  onEditLesson: (lesson: LessonTree) => void;
  onDeleteLesson: (lesson: LessonTree) => void;
  onAddItem: (lessonId: number) => void;
  onEditItem: (item: LessonItemTree, lessonId: number) => void;
  onDeleteItem: (item: LessonItemTree) => void;
  onLessonDragEnd: (chapterId: number, e: DragEndEvent) => void;
  onItemDragEnd: (lessonId: number, chapterId: number, e: DragEndEvent) => void;
}

function ChapterRow({
  chapter,
  courseId,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddLesson,
  expandedLessons,
  onToggleLesson,
  onEditLesson,
  onDeleteLesson,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onLessonDragEnd,
  onItemDragEnd,
}: ChapterRowProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn('border-divider rounded-lg border', isDragging && 'opacity-60 shadow-lg')}
    >
      <div className="bg-muted/30 flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Kéo thả"
        >
          <GripVertical className="size-4" />
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer"
          onClick={onToggle}
          title={expanded ? 'Thu gọn' : 'Mở rộng'}
        >
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate font-medium">
            <span className="text-muted-foreground mr-1.5 text-xs">Chương {chapter.order}.</span>
            {chapter.title}
          </p>
          {chapter.description && (
            <p className="text-muted-foreground truncate text-xs">{chapter.description}</p>
          )}
        </div>
        <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
          {chapter.lessons.length} bài
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Thêm bài học"
          className="cursor-pointer"
          onClick={onAddLesson}
        >
          <PlusCircle />
        </Button>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </div>

      {expanded && (
        <div className="px-3 py-2">
          {chapter.lessons.length === 0 ? (
            <div className="text-muted-foreground flex items-center justify-between gap-2 rounded-md px-3 py-3 text-sm italic">
              <span>Chưa có bài học nào</span>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={onAddLesson}>
                <Plus /> Thêm bài học
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => onLessonDragEnd(chapter.id, e)}
            >
              <SortableContext
                items={chapter.lessons.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1.5">
                  {chapter.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      chapterId={chapter.id}
                      courseId={courseId}
                      expanded={expandedLessons.has(lesson.id)}
                      onToggle={() => onToggleLesson(lesson.id)}
                      onEdit={() => onEditLesson(lesson)}
                      onDelete={() => onDeleteLesson(lesson)}
                      onAddItem={() => onAddItem(lesson.id)}
                      onEditItem={(item) => onEditItem(item, lesson.id)}
                      onDeleteItem={onDeleteItem}
                      onItemDragEnd={onItemDragEnd}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </li>
  );
}

interface LessonRowProps {
  lesson: LessonTree;
  chapterId: number;
  courseId: number;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onEditItem: (item: LessonItemTree) => void;
  onDeleteItem: (item: LessonItemTree) => void;
  onItemDragEnd: (lessonId: number, chapterId: number, e: DragEndEvent) => void;
}

function LessonRow({
  lesson,
  chapterId,
  courseId,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onItemDragEnd,
}: LessonRowProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-divider rounded-md border bg-white',
        isDragging && 'opacity-60 shadow-md',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Kéo thả"
        >
          <GripVertical className="size-4" />
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer"
          onClick={onToggle}
          title={expanded ? 'Thu gọn' : 'Mở rộng'}
        >
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-foreground flex items-center gap-2 truncate text-sm font-medium">
            <span className="text-muted-foreground text-xs">{lesson.order}.</span>
            {lesson.title}
            {lesson.isPreview && (
              <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                Preview
              </Badge>
            )}
          </p>
          {lesson.description && (
            <p className="text-muted-foreground truncate text-xs">{lesson.description}</p>
          )}
        </div>
        <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
          {lesson.items.length} mục
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Thêm mục"
          className="cursor-pointer"
          onClick={onAddItem}
        >
          <PlusCircle />
        </Button>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </div>

      {expanded && (
        <div className="border-divider border-t bg-slate-50/40 px-3 py-2">
          {lesson.items.length === 0 ? (
            <div className="text-muted-foreground flex items-center justify-between gap-2 px-3 py-2 text-sm italic">
              <span>Chưa có mục nào</span>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={onAddItem}>
                <Plus /> Thêm mục
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => onItemDragEnd(lesson.id, chapterId, e)}
            >
              <SortableContext
                items={lesson.items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1">
                  {lesson.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      courseId={courseId}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </li>
  );
}

interface ItemRowProps {
  item: LessonItemTree;
  courseId: number;
  onEdit: () => void;
  onDelete: () => void;
}

function ItemRow({ item, courseId, onEdit, onDelete }: ItemRowProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { enqueue, hasActive } = useUploadManager();
  const reuploadRef = useRef<HTMLInputElement | null>(null);
  const [reuploading, setReuploading] = useState(false);
  // Video UPLOADING mà KHÔNG có task đang chạy (vd sau reload) → cho "Tải lại".
  const canResume =
    item.type === 'VIDEO' && item.bunnyStatus === 'UPLOADING' && !hasActive(item.id);

  async function handleReuploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (reuploadRef.current) reuploadRef.current.value = '';
    if (!file || !item.bunnyVideoId) return;
    setReuploading(true);
    try {
      const tus = await getBunnyTusUploadAction({
        title: item.title,
        videoId: item.bunnyVideoId,
      });
      if (tus.errors.length || !tus.data) {
        handleActionErrors(tus.errors.length ? tus.errors : ['Không tạo được phiên upload']);
        return;
      }
      enqueue(file, {
        lessonItemId: item.id,
        courseId,
        videoId: tus.data.videoId,
        libraryId: tus.data.libraryId,
        signature: tus.data.signature,
        expire: tus.data.expire,
        tusEndpoint: tus.data.tusEndpoint,
      });
    } finally {
      setReuploading(false);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-divider flex items-center gap-2 rounded-md border bg-white px-3 py-1.5',
        isDragging && 'opacity-60 shadow',
      )}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Kéo thả"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="text-muted-foreground">
        {item.type === 'VIDEO' ? <Video className="size-4" /> : <FileText className="size-4" />}
      </span>
      <span className="text-foreground min-w-0 flex-1 truncate text-sm">
        <span className="text-muted-foreground mr-1.5 text-xs">{item.order}.</span>
        {item.title}
      </span>
      {item.type === 'VIDEO' ? (
        (() => {
          const meta = BUNNY_STATUS_META[item.bunnyStatus] ?? BUNNY_STATUS_META.ERROR;
          return (
            <Badge
              variant={meta.variant}
              className="flex items-center gap-1 px-1.5 py-0 text-[10px]"
            >
              {meta.pending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <ListChecks className="size-3" />
              )}
              {meta.label}
            </Badge>
          );
        })()
      ) : (
        <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
          Tài liệu
        </Badge>
      )}
      {canResume && (
        <>
          <input
            ref={reuploadRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleReuploadFile}
          />
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="shrink-0 cursor-pointer"
            title="Chọn lại file để tiếp tục tải lên"
            disabled={reuploading}
            onClick={() => reuploadRef.current?.click()}
          >
            <Upload className="size-3" /> Tải lại
          </Button>
        </>
      )}
      <RowActions onEdit={onEdit} onDelete={onDelete} size="xs" />
    </li>
  );
}
