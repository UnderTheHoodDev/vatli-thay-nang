import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTest } from '@/actions/v1/tests/get-test';
import { listSubmissions } from '@/actions/v1/tests/list-submissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminTestDetailClient, {
  TestHeaderBar,
} from '@/components/features/tests/AdminTestDetailClient';

interface Props {
  params: Promise<{ id: string; testId: string }>;
}

export default async function AdminTestDetailPage({ params }: Props) {
  const { id, testId } = await params;
  const courseId = Number(id);
  const tid = Number(testId);
  if (!Number.isInteger(courseId) || !Number.isInteger(tid)) notFound();

  // getTest là 1 dòng, rẻ — chờ luôn để quyết định notFound()/lỗi trước khi bắt đầu
  // stream response (đổi status sau khi đã stream là không được). listSubmissions thì
  // nặng hơn (gom hết trang + tính thống kê) nên KHÔNG await ở đây — AdminTestDetailClient
  // nhận promise này và tự unwrap bằng use(), phần khung (tiêu đề, nút xuất file) hiện
  // ngay trong lúc đó.
  const testRes = await getTest(tid);

  if (!testRes.data) {
    // Chỉ 404 mới là "không tồn tại". 403/500 mà cũng hiện 404 thì admin tưởng bài đã bị
    // xoá, trong khi thật ra là hết quyền hoặc BE lỗi.
    if (testRes.status === 404) notFound();

    return (
      <div className="space-y-4">
        <BackLink courseId={courseId} />
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {testRes.errors[0] ?? 'Không mở được bài kiểm tra'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const submissionsPromise = listSubmissions(tid);

  return (
    <div className="space-y-4">
      <BackLink courseId={courseId} />
      <TestHeaderBar test={testRes.data} />
      <Suspense fallback={<SubmissionsSkeleton />}>
        <AdminTestDetailClient
          courseId={courseId}
          test={testRes.data}
          submissionsPromise={submissionsPromise}
        />
      </Suspense>
    </div>
  );
}

function BackLink({ courseId }: { courseId: number }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 cursor-pointer">
      {/* tab=structure = tab "Nội dung", nơi có section bài kiểm tra */}
      <Link href={`/admin/courses/${courseId}?tab=structure`}>
        <ArrowLeft /> Nội dung khóa học
      </Link>
    </Button>
  );
}

function SubmissionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-start justify-between gap-3 py-6">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="size-9 shrink-0 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="pb-6">
          <Skeleton className="h-[260px] w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <Skeleton className="h-6 w-24" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-full sm:w-44" />
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-32" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="text-center">
                  <Skeleton className="mx-auto h-4 w-10" />
                </TableHead>
                <TableHead className="text-right">
                  <Skeleton className="ml-auto h-4 w-16" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="mx-auto h-4 w-12" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-20 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
