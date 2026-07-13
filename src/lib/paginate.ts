import type { PageMeta } from '@/types/tests';

/** BE chốt cứng `@Max(100)` cho pageSize — xin hơn là 400. */
export const MAX_PAGE_SIZE = 100;

/** Chốt chặn: `meta.total` sai (BE đếm một kiểu, trả một kiểu) thì đừng lặp vô tận. */
const MAX_PAGES = 50;

/**
 * Gom hết các trang thành một danh sách.
 *
 * Các màn bài kiểm tra đều cần TOÀN BỘ danh sách (chấm lần lượt, tính phổ điểm, xuất
 * file), nhưng BE giới hạn 100 dòng/trang. Xin đúng 100 rồi coi đó là tất cả thì lớp
 * trên 100 học sinh sẽ mất dòng mà không báo gì — tệ nhất là bảng thiếu người trong khi
 * thống kê vẫn đếm đủ, nên hai con số chửi nhau và admin không hiểu vì sao.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<{ data: T[]; meta: PageMeta }>,
): Promise<{ data: T[]; meta: PageMeta }> {
  const first = await fetchPage(1, MAX_PAGE_SIZE);
  const rows = [...first.data];
  const total = first.meta.total;

  let page = 2;
  for (; rows.length < total && page <= MAX_PAGES; page += 1) {
    const next = await fetchPage(page, MAX_PAGE_SIZE);
    if (next.data.length === 0) break;
    rows.push(...next.data);
  }

  // Chạm trần mà vẫn chưa đủ total: thà báo lỗi to còn hơn lặng lẽ trả thiếu dòng — đúng
  // cái bẫy mà cả tính năng này vốn dựng lên để tránh (xin 1 trang rồi coi là tất cả).
  if (rows.length < total && page > MAX_PAGES) {
    throw new Error(
      `fetchAllPages: chạm trần ${MAX_PAGES} trang mà mới lấy ${rows.length}/${total} dòng`,
    );
  }

  return { data: rows, meta: { total, page: 1, pageSize: rows.length } };
}
