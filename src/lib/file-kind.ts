import type { CourseFileKind } from '@/types/course-management';

// Phần mở rộng được coi là video (đi bunny Stream). Ưu tiên extension vì
// File.type của browser không tin cậy (thường rỗng / octet-stream).
const VIDEO_EXTENSIONS = new Set([
  'mp4',
  'mov',
  'webm',
  'mkv',
  'avi',
  'm4v',
  'flv',
  'wmv',
  'mpg',
  'mpeg',
  '3gp',
  'ts',
  'm2ts',
  'ogv',
]);

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  if (idx < 0 || idx === fileName.length - 1) return '';
  return fileName.slice(idx + 1).toLowerCase();
}

/**
 * Tự phát hiện loại tệp khi upload (không bắt người dùng chọn):
 * video → 'VIDEO' (bunny Stream + tracking); còn lại → 'DOCUMENT' (R2 xem inline).
 * Dựa extension trước, fallback MIME `video/*`.
 */
export function detectFileKind(file: File): CourseFileKind {
  const ext = getExtension(file.name);
  if (VIDEO_EXTENSIONS.has(ext)) return 'VIDEO';
  if (file.type.toLowerCase().startsWith('video/')) return 'VIDEO';
  return 'DOCUMENT';
}
