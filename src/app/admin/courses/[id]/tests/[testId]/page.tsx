import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTest } from '@/actions/v1/tests/get-test';
import { listSubmissions } from '@/actions/v1/tests/list-submissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminTestDetailClient from '@/components/features/tests/AdminTestDetailClient';

interface Props {
  params: Promise<{ id: string; testId: string }>;
}

export default async function AdminTestDetailPage({ params }: Props) {
  const { id, testId } = await params;
  const courseId = Number(id);
  const tid = Number(testId);
  if (!Number.isInteger(courseId) || !Number.isInteger(tid)) notFound();

  const [testRes, submissions] = await Promise.all([getTest(tid), listSubmissions(tid)]);

  if (!testRes.data) {
    // Chỉ 404 mới là "không tồn tại". 403/500 mà cũng hiện 404 thì admin tưởng bài đã bị
    // xoá, trong khi thật ra là hết quyền hoặc BE lỗi.
    if (testRes.status === 404) notFound();

    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 cursor-pointer">
          <Link href={`/admin/courses/${courseId}?tab=structure`}>
            <ArrowLeft /> Nội dung khóa học
          </Link>
        </Button>
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {testRes.errors[0] ?? 'Không mở được bài kiểm tra'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminTestDetailClient
      courseId={courseId}
      test={testRes.data}
      initialRows={submissions.data}
      initialStats={submissions.stats}
      errors={submissions.errors}
    />
  );
}
