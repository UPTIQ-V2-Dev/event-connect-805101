import { Calendar, TrendingUp, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/types/event';

interface EventStatsCardsProps {
    stats: DashboardStats;
}

export const EventStatsCards = ({ stats }: EventStatsCardsProps) => {
    return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Total Events</CardTitle>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                    <div className='text-2xl font-bold'>{stats.totalEvents}</div>
                    <p className='text-xs text-muted-foreground'>{stats.activeEvents} active events</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Total Attendees</CardTitle>
                    <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                    <div className='text-2xl font-bold'>{stats.totalAttendees}</div>
                    <p className='text-xs text-muted-foreground'>
                        +{stats.recentActivity.newRSVPs} new RSVPs this week
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Upcoming Events</CardTitle>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                    <div className='text-2xl font-bold'>{stats.upcomingEvents}</div>
                    <p className='text-xs text-muted-foreground'>In the next 30 days</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>Messages Sent</CardTitle>
                    <TrendingUp className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                    <div className='text-2xl font-bold'>{stats.recentActivity.messagessent}</div>
                    <p className='text-xs text-muted-foreground'>This month</p>
                </CardContent>
            </Card>
        </div>
    );
};
