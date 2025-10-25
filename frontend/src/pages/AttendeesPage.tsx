import { Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AttendeesPage = () => {
    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-3xl font-bold tracking-tight'>Attendees</h1>
                <p className='text-muted-foreground'>Manage attendees across all your events.</p>
            </div>

            <Card>
                <CardHeader className='text-center'>
                    <div className='mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4'>
                        <Users className='h-6 w-6 text-muted-foreground' />
                    </div>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        This page will allow you to manage attendees across all events, view their RSVP history, and
                        export attendee data.
                    </CardDescription>
                </CardHeader>
                <CardContent className='text-center'>
                    <Button variant='outline'>
                        <Calendar className='mr-2 h-4 w-4' />
                        Go to Events
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
