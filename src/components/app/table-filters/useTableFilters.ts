'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Quản lý filter bảng đồng bộ URL — thay cho cụm buildUrlParams + updateUrl
 * bị copy-paste ở mỗi trang danh sách.
 *
 * - `setText`  : ô text gõ-là-lọc (debounce rồi mới đẩy URL, reset page 1).
 * - `setValue` : select/lọc cột — áp ngay (reset page 1).
 * - `setPaging`: đổi page/pageSize — KHÔNG reset page.
 * - `clearAll` : về mặc định (xóa hết query).
 *
 * Key nào có giá trị bằng defaults thì bỏ khỏi URL cho gọn. `urlState` là
 * trạng thái server đọc từ searchParams truyền xuống; sau mỗi router.push RSC
 * refetch và prop này đổi theo.
 */
export function useTableFilters<S extends Record<string, string | number>>(opts: {
  urlState: S;
  defaults: S;
  debounceMs?: number;
}) {
  const { urlState, defaults, debounceMs = 400 } = opts;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Giá trị text đang gõ, hiển thị tức thời trong lúc chờ debounce + RSC refetch.
  const [draft, setDraft] = useState<Partial<Record<keyof S, string>>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // push chỉ được gọi từ event handler (sau effects) nên ref luôn kịp cập nhật.
  const urlStateRef = useRef(urlState);
  useEffect(() => {
    urlStateRef.current = urlState;
  }, [urlState]);

  // URL đã đuổi kịp draft (RSC refetch xong) → bỏ draft, quay về nguồn chân lý URL.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft((prev) => {
      const keys = Object.keys(prev) as (keyof S)[];
      const settled = keys.filter((k) => String(urlState[k] ?? '') === prev[k]);
      if (!settled.length) return prev;
      const next = { ...prev };
      for (const k of settled) delete next[k];
      return next;
    });
  }, [urlState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const push = useCallback(
    (next: Partial<S>, { resetPage = true }: { resetPage?: boolean } = {}) => {
      const merged: S = { ...urlStateRef.current, ...next };
      if (resetPage) (merged as Record<string, string | number>).page = defaults.page ?? 1;
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(merged)) {
        if (value == null || value === '') continue;
        if (String(value) === String(defaults[key] ?? '')) continue;
        sp.set(key, String(value));
      }
      const query = sp.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    // defaults là literal ổn định theo trang — không đưa vào deps để giữ push ổn định.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, pathname],
  );

  /** Giá trị hiển thị cho ô text: ưu tiên draft đang gõ, fallback URL. */
  const value = useCallback(
    (key: keyof S): string => draft[key] ?? String(urlState[key] ?? ''),
    [draft, urlState],
  );

  const setText = useCallback(
    (key: keyof S, v: string) => {
      setDraft((prev) => ({ ...prev, [key]: v }));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        push({ [key]: v } as Partial<S>);
      }, debounceMs);
    },
    [push, debounceMs],
  );

  const setValue = useCallback(
    (key: keyof S, v: string | number) => push({ [key]: v } as Partial<S>),
    [push],
  );

  const setPaging = useCallback(
    (next: Partial<Pick<S, Extract<keyof S, 'page' | 'pageSize'>>>) =>
      push(next as Partial<S>, { resetPage: false }),
    [push],
  );

  const clearAll = useCallback(() => {
    setDraft({});
    if (timerRef.current) clearTimeout(timerRef.current);
    startTransition(() => router.push(pathname, { scroll: false }));
  }, [router, pathname]);

  /** Các key đang lọc khác mặc định (bỏ page/pageSize) — cho badge đếm + chips. */
  const activeKeys = (Object.keys(urlState) as (keyof S)[]).filter(
    (k) =>
      k !== 'page' &&
      k !== 'pageSize' &&
      String(urlState[k] ?? '') !== '' &&
      String(urlState[k]) !== String(defaults[k] ?? ''),
  );

  return { value, setText, setValue, setPaging, clearAll, push, activeKeys, isPending };
}
