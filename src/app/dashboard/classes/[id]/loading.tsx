import { Skeleton } from '@/components/ui/skeleton';
import { CardContent } from '@/components/ui/card';
import GradientHeroCard from '@/components/app/GradientHeroCard';
import AttendanceSummaryCardSkeleton from '@/components/features/classes/AttendanceSummaryCardSkeleton';
import SessionsCardSkeleton from '@/components/features/classes/SessionsCardSkeleton';

export default function ClassDetailLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Skeleton className="h-8 w-36" />

      <GradientHeroCard>
        <CardContent className="relative space-y-3 py-7">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-xl bg-white/20" />
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-56 bg-white/20" />
              <Skeleton className="h-5 w-16 rounded bg-white/20" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/20" />
            </div>
          </div>
          <Skeleton className="h-4 w-72 max-w-full bg-white/20" />
        </CardContent>
      </GradientHeroCard>

      <AttendanceSummaryCardSkeleton />
      <SessionsCardSkeleton />
    </div>
  );
}
