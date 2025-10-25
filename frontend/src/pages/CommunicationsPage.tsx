import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const CommunicationsPage = () => {
    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-3xl font-bold tracking-tight'>Communications</h1>
                <p className='text-muted-foreground'>Send messages and manage communication with your attendees.</p>
            </div>

            <Card>
                <CardHeader className='text-center'>
                    <div className='mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4'>
                        <MessageSquare className='h-6 w-6 text-muted-foreground' />
                    </div>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>
                        This page will provide tools to send messages to attendees, manage email templates, and track
                        message delivery status.
                    </CardDescription>
                </CardHeader>
                <CardContent className='text-center'>
                    <Button variant='outline'>
                        <Plus className='mr-2 h-4 w-4' />
                        Create Message Template
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
