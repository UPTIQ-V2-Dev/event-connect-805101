import { Plus, Calendar, MessageSquare, Users, FileText, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const quickActions = [
    {
        title: 'Create Event',
        description: 'Set up a new event and start collecting RSVPs',
        icon: Plus,
        href: '/events/new',
        variant: 'default' as const
    },
    {
        title: 'View All Events',
        description: 'Manage and track all your events',
        icon: Calendar,
        href: '/events',
        variant: 'outline' as const
    },
    {
        title: 'Send Message',
        description: 'Communicate with your attendees',
        icon: MessageSquare,
        href: '/communications',
        variant: 'outline' as const
    },
    {
        title: 'Manage Attendees',
        description: 'View and manage event attendees',
        icon: Users,
        href: '/attendees',
        variant: 'outline' as const
    },
    {
        title: 'Export Reports',
        description: 'Generate attendance and engagement reports',
        icon: FileText,
        href: '/reports',
        variant: 'outline' as const
    },
    {
        title: 'Settings',
        description: 'Configure your account and preferences',
        icon: Settings,
        href: '/settings',
        variant: 'outline' as const
    }
];

export const QuickActionsGrid = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks to help you manage your events efficiently</CardDescription>
            </CardHeader>
            <CardContent>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {quickActions.map(action => (
                        <div
                            key={action.title}
                            className='rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors'
                        >
                            <div className='flex items-start gap-3'>
                                <div className='rounded-md bg-muted p-2'>
                                    <action.icon className='h-4 w-4' />
                                </div>
                                <div className='flex-1 space-y-2'>
                                    <h3 className='font-medium text-sm'>{action.title}</h3>
                                    <p className='text-xs text-muted-foreground'>{action.description}</p>
                                    <Button
                                        variant={action.variant}
                                        size='sm'
                                        asChild
                                        className='w-full'
                                    >
                                        <Link to={action.href}>{action.title}</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
