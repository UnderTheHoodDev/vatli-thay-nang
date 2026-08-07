'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface TuitionDraft {
  amountDue: string;
  amountPaid: string;
  paidDate: string; // '' = chưa ghi nhận
  note: string;
}

interface DraftsApi {
  drafts: Map<number, TuitionDraft>;
  dirtyCount: number;
  /** Sửa 1 ô. `base` là giá trị server, dùng để khởi tạo nháp ở lần gõ đầu tiên. */
  patch: (rowId: number, base: TuitionDraft, next: Partial<TuitionDraft>) => void;
  discard: (rowId: number) => void;
  discardAll: () => void;
}

const Ctx = createContext<DraftsApi | null>(null);

export function useTuitionDrafts(): DraftsApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTuitionDrafts phải nằm trong <TuitionDraftsProvider>');
  return ctx;
}

export default function TuitionDraftsProvider({ children }: { children: React.ReactNode }) {
  const [drafts, setDrafts] = useState<Map<number, TuitionDraft>>(new Map());

  const patch = useCallback((rowId: number, base: TuitionDraft, next: Partial<TuitionDraft>) => {
    setDrafts((prev) => {
      const m = new Map(prev);
      m.set(rowId, { ...(prev.get(rowId) ?? base), ...next });
      return m;
    });
  }, []);

  const discard = useCallback((rowId: number) => {
    setDrafts((prev) => {
      if (!prev.has(rowId)) return prev;
      const m = new Map(prev);
      m.delete(rowId);
      return m;
    });
  }, []);

  const discardAll = useCallback(() => {
    setDrafts((prev) => (prev.size === 0 ? prev : new Map()));
  }, []);

  const value = useMemo<DraftsApi>(
    () => ({ drafts, dirtyCount: drafts.size, patch, discard, discardAll }),
    [drafts, patch, discard, discardAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
