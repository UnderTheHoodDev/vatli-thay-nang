const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString('vi-VN', {
    timeZone: VN_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string | Date | null | undefined, fallback = '—'): string {
  if (iso === null || iso === undefined || iso === '') return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('vi-VN', {
    timeZone: VN_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTimeShort(iso: string | Date): string {
  return new Date(iso).toLocaleString('vi-VN', {
    timeZone: VN_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Ngày (YYYY-MM-DD) theo giờ VN của một mốc thời gian.
 *
 * Không dùng getFullYear/getMonth/getDate (giờ máy) rồi toISOString (UTC) như trước:
 * cách đó vừa lệch múi ở chính máy đang chạy, vừa cho ra hai kết quả khác nhau giữa
 * SSR (Vercel chạy UTC) và trình duyệt (UTC+7) — tức là hydration mismatch ngay trên
 * một <input type="date">. en-CA cho sẵn định dạng YYYY-MM-DD.
 */
function vnDateISO(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function firstOfMonthISO(): string {
  return `${vnDateISO(new Date()).slice(0, 8)}01`;
}

export function todayISO(): string {
  return vnDateISO(new Date());
}
