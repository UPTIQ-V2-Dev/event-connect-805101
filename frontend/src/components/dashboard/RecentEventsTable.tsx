import { format } from 'date-fns';
import { Eye, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RecentEvent } from '@/types/event';

interface RecentEventsTableProps {
    events: RecentEvent[];
}

const getStatusColor = (status: RecentEvent['status']) => {
    switch (status) {
        case 'published':
            return 'default';
        case 'draft':
            return 'secondary';
        case 'cancelled':
            return 'destructive';
        case 'completed':
            return 'outline';
        default:
            return 'secondary';
    }
};

export const RecentEventsTable = ({ events }: RecentEventsTableProps) => {
    if (events.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Events</CardTitle>
                    <CardDescription>Your latest events and their RSVP status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col items-center justify-center py-8 text-center'>
                        <Calendar className='h-8 w-8 text-muted-foreground mb-2' />
                        <p className='text-muted-foreground'>No events found</p>
                        <Button
                            asChild
                            className='mt-4'
                        >
                            <Link to='/events/new'>Create your first event</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Your latest events and their RSVP status</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Attendees</TableHead>
                            <TableHead>RSVPs</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map(event => (
                            <TableRow key={event.id}>
                                <TableCell className='font-medium'>{event.title}</TableCell>
                                <TableCell>{format(new Date(event.startDate), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(event.status)}>{event.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className='flex items-center gap-1'>
                                        <Users className='h-4 w-4 text-muted-foreground' />
                                        {event.attendeeCount}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className='flex gap-1 text-sm'>
                                        <span className='text-green-600'>{event.rsvpStats.attending} Yes</span>
                                        <span className='text-red-600'>{event.rsvpStats.notAttending} No</span>
                                        <span className='text-yellow-600'>{event.rsvpStats.maybe} Maybe</span>
                                    </div>
                                </TableCell>
                                <TableCell className='text-right'>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        asChild
                                    >
                                        <Link to={`/events/${event.id}`}>
                                            <Eye className='h-4 w-4' />
                                            View
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
