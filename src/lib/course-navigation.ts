import type { CourseDetail, CourseNodeTree } from '@/types/course-management';

export interface FlatFile {
  node: CourseNodeTree;
  /** Breadcrumb các folder cha (từ gốc → gần nhất). */
  pathTitles: string[];
  /** Học sinh có quyền xem tệp này không (đã ghi danh). */
  accessible: boolean;
}

/**
 * Duyệt cây khóa học (DFS theo order) thành danh sách phẳng các TỆP (FILE),
 * bỏ qua FOLDER. Không còn preview → `accessible = isEnrolled` cho mọi tệp.
 */
export function flattenTree(course: CourseDetail, isEnrolled: boolean): FlatFile[] {
  const flat: FlatFile[] = [];
  const walk = (nodes: CourseNodeTree[], path: string[]) => {
    const sorted = [...nodes].sort((a, b) => a.order - b.order);
    for (const n of sorted) {
      if (n.type === 'FOLDER') {
        walk(n.children ?? [], [...path, n.title]);
      } else {
        flat.push({ node: n, pathTitles: path, accessible: isEnrolled });
      }
    }
  };
  walk(course.nodes, []);
  return flat;
}

export function findFileIndex(flat: FlatFile[], nodeId: number | null): number {
  if (nodeId == null) return -1;
  return flat.findIndex((f) => f.node.id === nodeId);
}

/** Tệp liền trước (không skip tệp khóa); null nếu đã ở đầu. */
export function prevFile(flat: FlatFile[], nodeId: number | null): FlatFile | null {
  const idx = findFileIndex(flat, nodeId);
  if (idx <= 0) return null;
  return flat[idx - 1];
}

/** Tệp liền sau (không skip tệp khóa); null nếu đã ở cuối. */
export function nextFile(flat: FlatFile[], nodeId: number | null): FlatFile | null {
  const idx = findFileIndex(flat, nodeId);
  if (idx < 0 || idx >= flat.length - 1) return null;
  return flat[idx + 1];
}

/** Tệp active hiện tại; fallback tệp đầu tiên nếu id không hợp lệ. */
export function resolveActiveFile(flat: FlatFile[], nodeId: number | null): FlatFile | null {
  const idx = findFileIndex(flat, nodeId);
  if (idx >= 0) return flat[idx];
  return flat[0] ?? null;
}
