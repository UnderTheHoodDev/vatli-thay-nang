'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import ClassInfoTab from '@/components/features/classes/ClassInfoTab';
import ClassStudentsTab from '@/components/features/classes/ClassStudentsTab';
import type { ClassStudentSearchValues } from '@/components/features/classes/ClassStudentsSearchForm';
import type { ListMeta } from '@/types/auth';
import type { ClassStudentListRow } from '@/types/actions/class-management';
import type { ClassDetail } from '@/types/class-management';

export type ClassDetailTab = 'info' | 'students';

export interface ClassDetailUrlState extends ClassStudentSearchValues {
  tab: ClassDetailTab;
  page: number;
  pageSize: number;
}

interface Props {
  classDetail: ClassDetail;
  urlState: ClassDetailUrlState;
  students: ClassStudentListRow[];
  studentsMeta: ListMeta;
}

const TABS: Array<{ id: ClassDetailTab; label: string }> = [
  { id: 'info', label: 'Thông tin lớp học' },
  { id: 'students', label: 'Danh sách học sinh' },
];

const DEFAULT_TAB: ClassDetailTab = 'info';
const DEFAULT_PAGE_SIZE = 20;

function buildUrlParams(state: ClassDetailUrlState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.tab !== DEFAULT_TAB) sp.set('tab', state.tab);
  if (state.email) sp.set('email', state.email);
  if (state.fullName) sp.set('fullName', state.fullName);
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== DEFAULT_PAGE_SIZE) sp.set('pageSize', String(state.pageSize));
  return sp;
}

export default function ClassDetailPageClient({
  classDetail,
  urlState,
  students,
  studentsMeta,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const updateUrl = useCallback(
    (next: Partial<ClassDetailUrlState>) => {
      const merged = { ...urlState, ...next };
      const params = buildUrlParams(merged);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, urlState],
  );

  const studentsSearch: ClassStudentSearchValues = {
    email: urlState.email,
    fullName: urlState.fullName,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-paytone text-purple text-2xl">{classDetail.name}</h1>
        <p className="text-sm text-gray-500">
          Mã lớp: <span className="font-mono">{classDetail.code}</span>
        </p>
      </div>

      <div role="tablist" className="border-divider flex gap-1 border-b">
        {TABS.map((t) => {
          const active = urlState.tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => updateUrl({ tab: t.id })}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-purple text-purple'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {urlState.tab === 'info' ? (
        <ClassInfoTab classDetail={classDetail} />
      ) : (
        <ClassStudentsTab
          classId={classDetail.id}
          search={studentsSearch}
          rows={students}
          meta={studentsMeta}
          onSearchChange={(v) => updateUrl({ ...v, page: 1 })}
          onPageChange={(p) => updateUrl({ page: p })}
          onPageSizeChange={(s) => updateUrl({ pageSize: s, page: 1 })}
        />
      )}
    </div>
  );
}
