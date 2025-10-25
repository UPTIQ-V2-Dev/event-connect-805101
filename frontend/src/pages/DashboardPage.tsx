import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { EventStatsCards } from '@/components/dashboard/EventStatsCards';
import { RecentEventsTable } from '@/components/dashboard/RecentEventsTable';
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { eventService } from '@/services/events';

export const DashboardPage = () => {
    const {
        data: stats,
        isLoading: statsLoading,
        error: statsError
    } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: eventService.getDashboardStats
    });

    const {
        data: recentEvents,
        isLoading: eventsLoading,
        error: eventsError
    } = useQuery({
        queryKey: ['recent-events'],
        queryFn: eventService.getRecentEvents
    });

    const isLoading = statsLoading || eventsLoading;
    const hasError = statsError || eventsError;

    if (hasError) {
        return (
            <div className='space-y-6'>
                <Alert variant='destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>Failed to load dashboard data. Please try again later.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
                <p className='text-muted-foreground'>Welcome back! Here's what's happening with your events.</p>
            </div>

            {isLoading ? (
                <div className='space-y-6'>
                    {/* Stats Cards Skeleton */}
                    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className='h-[120px] rounded-lg'
                            />
                        ))}
                    </div>

                    {/* Recent Events Skeleton */}
                    <Skeleton className='h-[400px] rounded-lg' />

                    {/* Quick Actions Skeleton */}
                    <Skeleton className='h-[300px] rounded-lg' />
                </div>
            ) : (
                <>
                    {stats && <EventStatsCards stats={stats} />}

                    <div className='grid gap-6 lg:grid-cols-7'>
                        <div className='lg:col-span-4'>
                            {recentEvents && <RecentEventsTable events={recentEvents} />}
                        </div>
                        <div className='lg:col-span-3'>
                            <QuickActionsGrid />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
