/**
 * Class cho CỘT GHIM khi bảng scroll ngang — cột Hành động ghim phải để luôn
 * bấm được không phải kéo tới cuối; cột nhận diện (checkbox/ID/email) ghim trái
 * để kéo giữa bảng vẫn biết đang ở hàng nào.
 *
 * Cell ghim bắt buộc nền ĐỤC (nội dung scroll bên dưới sẽ lộ qua nền trong).
 * Hàng của bảng chỉ đổi màu hover bằng lớp mờ trên nền card, nên cell ghim phải
 * tự đổi màu theo hàng: thêm `group/r hover:bg-muted` vào TableRow chứa nó —
 * hover dùng bg-muted đặc để cell ghim (group-hover) khớp màu tuyệt đối.
 *
 * Header của cột ghim cũng phải ghim (không thì kéo ngang header lệch khỏi
 * thân); nền header = muted 40% trên card → dùng color-mix cho ra màu đặc
 * tương đương.
 */

/** Nền đặc tương đương bg-muted/40 đè lên bg-card (nền header bảng). */
export const HEAD_BG = 'bg-[color-mix(in_srgb,var(--color-muted)_40%,var(--color-card))]';

/** Bóng mép trái của cột ghim phải — báo còn nội dung khuất bên dưới. */
const SHADOW_LEFT = 'shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]';
/** Bóng mép phải của cột ghim trái. */
export const SHADOW_RIGHT = 'shadow-[8px_0_8px_-8px_rgba(0,0,0,0.15)]';

/** Đổi màu theo trạng thái hàng (yêu cầu TableRow có `group/r hover:bg-muted`).
 * Bảng nào tự thêm biến thể trạng thái riêng (vd: dòng "dirty" ở học phí) thì
 * ghép thêm `group-data-[<attr>]/r:bg-<color>` vào sau, không thay cái này. */
export const ROW_SYNC = 'group-hover/r:bg-muted group-data-[state=selected]/r:bg-muted';

export const STICKY_ACTION_HEAD = `sticky right-0 z-10 ${HEAD_BG} ${SHADOW_LEFT}`;
export const STICKY_ACTION_CELL = `sticky right-0 z-10 bg-card transition-colors ${ROW_SYNC} ${SHADOW_LEFT}`;

/** Cột ghim trái ở vị trí thứ 1/2/3 (offset cộng dồn theo bề rộng cố định). */
export const STICKY_L0_HEAD = `sticky left-0 z-10 ${HEAD_BG}`;
export const STICKY_L0_CELL = `sticky left-0 z-10 bg-card transition-colors ${ROW_SYNC}`;
export const STICKY_L10_HEAD = `sticky left-10 z-10 ${HEAD_BG}`;
export const STICKY_L10_CELL = `sticky left-10 z-10 bg-card transition-colors ${ROW_SYNC}`;
/** Cột cuối của cụm ghim trái — mang bóng phân cách. */
export const STICKY_L24_HEAD = `sticky left-24 z-10 ${HEAD_BG} ${SHADOW_RIGHT}`;
export const STICKY_L24_CELL = `sticky left-24 z-10 bg-card transition-colors ${ROW_SYNC} ${SHADOW_RIGHT}`;

/** Hàng chứa cell ghim phải khai báo các lớp này để cell đổi màu khớp hàng. */
export const STICKY_ROW = 'group/r hover:bg-muted';
