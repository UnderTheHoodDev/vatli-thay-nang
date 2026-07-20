import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDate as formatDateVN } from './format';

/**
 * Merge Tailwind CSS classes with clsx
 * Library-dependent utility for combining conditional classes
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @deprecated Dùng `formatDate` từ `@/lib/format`. Giữ lại ở đây chỉ để không phải
 * sửa placeholder ('-') tại 5 chỗ gọi sẵn có.
 *
 * Bản cũ tự dựng chuỗi bằng getDate/getMonth/getFullYear — tức là theo giờ của máy
 * đang render. Trên Vercel (UTC) và trình duyệt VN (UTC+7), cùng một mốc thời gian
 * cho ra hai ngày khác nhau → React #418. Nay ủy quyền cho bản đã ghim Asia/Ho_Chi_Minh.
 */
export function formatDate(value: string | null | undefined): string {
  return formatDateVN(value, '-');
}
