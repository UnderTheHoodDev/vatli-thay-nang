import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TableSkeleton from '@/components/app/TableSkeleton';

const COLUMN_WIDTHS = ['w-48', 'w-32', 'w-32', 'w-20', 'w-28'];

export default function SessionsCardSkeleton() {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="ml-11.5 h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4 sm:pb-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-50">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="min-w-37.5">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="min-w-37.5">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-32">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-36">
                <Skeleton className="h-4 w-20" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton rows={8} columnWidths={COLUMN_WIDTHS} />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
