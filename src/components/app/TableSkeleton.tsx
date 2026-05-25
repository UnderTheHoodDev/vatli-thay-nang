import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Props {
  rows?: number;
  columnWidths: string[];
}

export default function TableSkeleton({ rows = 6, columnWidths }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          {columnWidths.map((w, j) => (
            <TableCell key={j}>
              <Skeleton className={cn('h-4', w)} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
