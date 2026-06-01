import type { CourseDetail, LessonItemTree } from '@/types/course-management';

export interface FlatItem {
  item: LessonItemTree;
  lessonId: number;
  lessonTitle: string;
  lessonIsPreview: boolean;
  chapterTitle: string;
  chapterOrder: number;
  /** Học sinh có quyền xem item này không (enrolled hoặc lesson preview). */
  accessible: boolean;
}

/**
 * Duyệt cây khóa học thành danh sách phẳng theo thứ tự
 * chapter.order → lesson.order → item.order.
 */
export function flattenItems(course: CourseDetail, isEnrolled: boolean): FlatItem[] {
  const flat: FlatItem[] = [];
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      const accessible = isEnrolled || lesson.isPreview;
      for (const item of lesson.items) {
        flat.push({
          item,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonIsPreview: lesson.isPreview,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          accessible,
        });
      }
    }
  }
  return flat;
}

export function findItemIndex(flat: FlatItem[], itemId: number | null): number {
  if (itemId == null) return -1;
  return flat.findIndex((f) => f.item.id === itemId);
}

/** Item liền trước (không skip item khóa); null nếu đã ở đầu. */
export function prevItem(flat: FlatItem[], itemId: number | null): FlatItem | null {
  const idx = findItemIndex(flat, itemId);
  if (idx <= 0) return null;
  return flat[idx - 1];
}

/** Item liền sau (không skip item khóa); null nếu đã ở cuối. */
export function nextItem(flat: FlatItem[], itemId: number | null): FlatItem | null {
  const idx = findItemIndex(flat, itemId);
  if (idx < 0 || idx >= flat.length - 1) return null;
  return flat[idx + 1];
}

/** Item active hiện tại; fallback item đầu tiên nếu id không hợp lệ. */
export function resolveActive(flat: FlatItem[], itemId: number | null): FlatItem | null {
  const idx = findItemIndex(flat, itemId);
  if (idx >= 0) return flat[idx];
  return flat[0] ?? null;
}
