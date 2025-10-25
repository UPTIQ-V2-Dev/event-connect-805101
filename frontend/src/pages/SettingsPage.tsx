import { User, Bell, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const SettingsPage = () => {
    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
                <p className='text-muted-foreground'>Manage your account settings and preferences.</p>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                <Card>
                    <CardHeader>
                        <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2'>
                            <User className='h-4 w-4 text-muted-foreground' />
                        </div>
                        <CardTitle className='text-lg'>Profile</CardTitle>
                        <CardDescription>Update your personal information and account details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant='outline'
                            className='w-full'
                        >
                            Coming Soon
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2'>
                            <Bell className='h-4 w-4 text-muted-foreground' />
                        </div>
                        <CardTitle className='text-lg'>Notifications</CardTitle>
                        <CardDescription>Configure how you receive notifications and alerts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant='outline'
                            className='w-full'
                        >
                            Coming Soon
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2'>
                            <Palette className='h-4 w-4 text-muted-foreground' />
                        </div>
                        <CardTitle className='text-lg'>Appearance</CardTitle>
                        <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant='outline'
                            className='w-full'
                        >
                            Coming Soon
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
