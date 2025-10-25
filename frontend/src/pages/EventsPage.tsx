import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Grid, List, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventCard } from '@/components/events/EventCard';
import { EventFilters } from '@/components/events/EventFilters';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Toggle } from '@/components/ui/toggle';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { eventService } from '@/services/events';
import type { EventFilters as EventFiltersType } from '@/types/event';

export const EventsPage = () => {
    const [filters, setFilters] = useState<EventFiltersType>({});
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const {
        data: eventsData,
        isLoading,
        error
    } = useQuery({
        queryKey: ['events', filters],
        queryFn: () => eventService.getEvents(filters)
    });

    const deleteEventMutation = useMutation({
        mutationFn: eventService.deleteEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['recent-events'] });
            toast.success('Event deleted successfully');
            setDeleteEventId(null);
        },
        onError: () => {
            toast.error('Failed to delete event');
        }
    });

    const handleDeleteEvent = (eventId: string) => {
        setDeleteEventId(eventId);
    };

    const confirmDelete = () => {
        if (deleteEventId) {
            deleteEventMutation.mutate(deleteEventId);
        }
    };

    const clearFilters = () => {
        setFilters({});
    };

    if (error) {
        return (
            <div className='space-y-6'>
                <Alert variant='destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>Failed to load events. Please try again later.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold tracking-tight'>Events</h1>
                    <p className='text-muted-foreground'>Manage and track all your events in one place.</p>
                </div>
                <Button asChild>
                    <Link to='/events/new'>
                        <Plus className='mr-2 h-4 w-4' />
                        Create Event
                    </Link>
                </Button>
            </div>

            <EventFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
            />

            <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                    {isLoading
                        ? 'Loading events...'
                        : eventsData
                          ? `Showing ${eventsData.results.length} of ${eventsData.totalResults} events`
                          : 'No events found'}
                </div>

                <div className='flex items-center gap-1'>
                    <Toggle
                        pressed={viewMode === 'grid'}
                        onPressedChange={() => setViewMode('grid')}
                        aria-label='Grid view'
                        size='sm'
                    >
                        <Grid className='h-4 w-4' />
                    </Toggle>
                    <Toggle
                        pressed={viewMode === 'list'}
                        onPressedChange={() => setViewMode('list')}
                        aria-label='List view'
                        size='sm'
                    >
                        <List className='h-4 w-4' />
                    </Toggle>
                </div>
            </div>

            {isLoading ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className='h-[300px] rounded-lg'
                        />
                    ))}
                </div>
            ) : eventsData && eventsData.results.length > 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {eventsData.results.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onDelete={handleDeleteEvent}
                        />
                    ))}
                </div>
            ) : (
                <div className='text-center py-12'>
                    <div className='mx-auto max-w-md'>
                        <div className='mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4'>
                            <Plus className='h-6 w-6 text-muted-foreground' />
                        </div>
                        <h3 className='text-lg font-medium mb-2'>No events found</h3>
                        <p className='text-muted-foreground mb-4'>
                            {Object.keys(filters).length > 0
                                ? 'No events match your current filters. Try adjusting your search criteria.'
                                : 'Get started by creating your first event.'}
                        </p>
                        <div className='flex gap-2 justify-center'>
                            <Button asChild>
                                <Link to='/events/new'>
                                    <Plus className='mr-2 h-4 w-4' />
                                    Create Event
                                </Link>
                            </Button>
                            {Object.keys(filters).length > 0 && (
                                <Button
                                    variant='outline'
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog
                open={!!deleteEventId}
                onOpenChange={() => setDeleteEventId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this event? This action cannot be undone. All RSVPs and
                            associated data will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            Delete Event
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
