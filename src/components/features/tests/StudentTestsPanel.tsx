'use client';

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { listTests } from '@/actions/v1/tests/list-tests';
import EmptyState from '@/components/app/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { handleActionErrors } from '@/lib/actions';
import type { StudentTestRow, TestPhase } from '@/types/tests';
import StudentTestDetail from './StudentTestDetail';

interface Props {
  courseId: number;
}

const PHASE: Record<TestPhase, { text: string; variant: 'secondary' | 'default' | 'outline' }> = {
  SCHEDULED: { text: 'Sắp diễn ra', variant: 'outline' },
  ONGOING: { text: 'Đang mở', variant: 'default' },
  ENDED: { text: 'Đã kết thúc', variant: 'secondary' },
};

function formatRange(start: string, end: string): string {
  const f = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  return `${f(start)} → ${f(end)}`;
}

/** Trạng thái bài của chính mình. Điểm chỉ lộ khi bài đã kết thúc VÀ đã chấm (BE chốt). */
function myStatusText(t: StudentTestRow, maxScore: number): string {
  if (t.myScore !== null) return `${t.myScore}/${maxScore} điểm`;
  if (t.mySubmissionStatus === 'NOT_SUBMITTED') return 'Chưa nộp';
  return 'Đã nộp';
}

export default function StudentTestsPanel({ courseId }: Props) {
  const [tests, setTests] = useState<StudentTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);

  const load = useCallback(async (): Promise<boolean> => {
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;

    const res = await listTests<StudentTestRow>(courseId);
    if (!mountedRef.current || requestSeqRef.current !== seq) return false;

    if (res.errors.length) handleActionErrors(res.errors);
    setTests(res.data);
    setLoading(false);
    return !res.errors.length;
  }, [courseId]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
      requestSeqRef.current += 1;
    };
  }, [load]);

  function openTest(id: number) {
    setOpenId(id);
  }

  function handleCardKeyDown(e: KeyboardEvent<HTMLDivElement>, id: number) {
    if (e.key === 'Enter') openTest(id);
    if (e.key === ' ') e.preventDefault();
  }

  function handleCardKeyUp(e: KeyboardEvent<HTMLDivElement>, id: number) {
    if (e.key === ' ') openTest(id);
  }

  if (openId !== null) {
    return (
      <StudentTestDetail
        courseId={courseId}
        testId={openId}
        onBack={() => {
          setOpenId(null);
          void load();
        }}
      />
    );
  }

  if (loading) {
    return <p className="text-muted-foreground py-10 text-center text-sm">Đang tải…</p>;
  }

  if (tests.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Chưa có bài kiểm tra"
        description="Khi giáo viên ra đề, bài kiểm tra sẽ xuất hiện ở đây."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {tests.map((t) => {
        const phase = PHASE[t.phase];
        return (
          <li key={t.id}>
            <Card
              role="button"
              tabIndex={0}
              aria-label={`Mở bài kiểm tra ${t.title}`}
              onClick={() => openTest(t.id)}
              onKeyDown={(e) => handleCardKeyDown(e, t.id)}
              onKeyUp={(e) => handleCardKeyUp(e, t.id)}
              className="hover:border-purple focus-visible:ring-ring/50 cursor-pointer transition outline-none focus-visible:ring-[3px]"
            >
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatRange(t.startTime, t.endTime)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    {myStatusText(t, t.maxScore)}
                  </span>
                  <Badge variant={phase.variant}>{phase.text}</Badge>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
