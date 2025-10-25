import { format } from 'date-fns';
import { Calendar, MapPin, Users, Eye, Edit, Trash2, Globe, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Event } from '@/types/event';

interface EventCardProps {
    event: Event;
    onDelete?: (eventId: string) => void;
}

const getStatusColor = (status: Event['status']) => {
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

export const EventCard = ({ event, onDelete }: EventCardProps) => {
    return (
        <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                    <div className='space-y-1 flex-1'>
                        <div className='flex items-center gap-2'>
                            <h3 className='font-semibold text-lg leading-none'>{event.title}</h3>
                            {event.visibility === 'public' ? (
                                <Globe className='h-4 w-4 text-muted-foreground' />
                            ) : (
                                <Lock className='h-4 w-4 text-muted-foreground' />
                            )}
                        </div>
                        <Badge
                            variant={getStatusColor(event.status)}
                            className='w-fit'
                        >
                            {event.status}
                        </Badge>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant='ghost'
                                size='sm'
                            >
                                •••
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                            <DropdownMenuItem asChild>
                                <Link to={`/events/${event.id}`}>
                                    <Eye className='mr-2 h-4 w-4' />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={`/events/${event.id}/edit`}>
                                    <Edit className='mr-2 h-4 w-4' />
                                    Edit Event
                                </Link>
                            </DropdownMenuItem>
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={() => onDelete(event.id)}
                                    className='text-destructive'
                                >
                                    <Trash2 className='mr-2 h-4 w-4' />
                                    Delete Event
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className='pb-3'>
                <p className='text-sm text-muted-foreground line-clamp-2 mb-3'>{event.description}</p>

                <div className='space-y-2 text-sm'>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                        <Calendar className='h-4 w-4' />
                        {format(new Date(event.startDate), 'MMM d, yyyy • h:mm a')}
                        {event.endDate && <span>- {format(new Date(event.endDate), 'h:mm a')}</span>}
                    </div>

                    <div className='flex items-center gap-2 text-muted-foreground'>
                        <MapPin className='h-4 w-4 flex-shrink-0' />
                        {event.location.type === 'physical' && event.location.address && (
                            <span className='line-clamp-1'>{event.location.address}</span>
                        )}
                        {event.location.type === 'virtual' && <span>Virtual Event</span>}
                        {event.location.type === 'hybrid' && <span>Hybrid Event</span>}
                    </div>

                    <div className='flex items-center gap-2 text-muted-foreground'>
                        <Users className='h-4 w-4' />
                        {event.attendeeCount} attendees
                        {event.capacity && <span>/ {event.capacity} capacity</span>}
                    </div>
                </div>
            </CardContent>

            <CardFooter className='pt-3 border-t'>
                <div className='flex items-center justify-between w-full'>
                    <div className='flex gap-2 text-xs'>
                        <span className='text-green-600'>{event.rsvpStats.attending} Yes</span>
                        <span className='text-red-600'>{event.rsvpStats.notAttending} No</span>
                        <span className='text-yellow-600'>{event.rsvpStats.maybe} Maybe</span>
                        <span className='text-muted-foreground'>{event.rsvpStats.pending} Pending</span>
                    </div>

                    <Button
                        variant='outline'
                        size='sm'
                        asChild
                    >
                        <Link to={`/events/${event.id}`}>View Details</Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};
