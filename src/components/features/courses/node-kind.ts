import { FileText, PlayCircle, type LucideIcon } from 'lucide-react';

export type FileKindKey = 'VIDEO' | 'DOCUMENT';

interface FileKindStyle {
  label: string;
  icon: LucideIcon;
  /** Màu icon trên nền trắng/hover. */
  iconClass: string;
  /** Ô icon có nền nhạt — dùng ở cây nội dung admin. */
  chipClass: string;
  badgeClass: string;
}

/**
 * Màu phân biệt loại bài học, dùng chung cho cây nội dung (admin) và danh sách bài (học
 * sinh). Hai sắc độ cách xa nhau và đều khác tím thương hiệu (dành cho thư mục chương).
 */
export const FILE_KIND_STYLE: Record<FileKindKey, FileKindStyle> = {
  VIDEO: {
    label: 'Video',
    icon: PlayCircle,
    iconClass: 'text-rose-600 dark:text-rose-400',
    chipClass:
      'bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/25',
    badgeClass:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300',
  },
  DOCUMENT: {
    label: 'Tài liệu',
    icon: FileText,
    iconClass: 'text-sky-700 dark:text-sky-400',
    chipClass:
      'bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/25',
    badgeClass:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300',
  },
};

export function fileKindStyle(fileKind: string | null | undefined): FileKindStyle {
  return fileKind === 'VIDEO' ? FILE_KIND_STYLE.VIDEO : FILE_KIND_STYLE.DOCUMENT;
}
