import { Skeleton } from '@/components/ui/skeleton';
import { CardContent } from '@/components/ui/card';
import GradientHeroCard from '@/components/app/GradientHeroCard';
import DashboardClassesSkeleton from '@/components/features/classes/DashboardClassesSkeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <GradientHeroCard>
        <CardContent className="relative flex flex-col gap-3 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-36 bg-white/20" />
            <Skeleton className="h-8 w-48 bg-white/20" />
            <Skeleton className="h-4 w-72 max-w-full bg-white/20" />
          </div>
          <Skeleton className="h-9 w-36 self-start bg-white/70 sm:self-center" />
        </CardContent>
      </GradientHeroCard>

      <DashboardClassesSkeleton />
    </div>
  );
}
