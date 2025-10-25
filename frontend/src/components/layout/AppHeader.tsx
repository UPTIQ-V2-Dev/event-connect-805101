import { Bell, Search } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const AppHeader = () => {
    const { toggleSidebar } = useSidebar();

    return (
        <header className='flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6'>
            <div className='flex items-center gap-4'>
                <Button
                    variant='ghost'
                    size='icon'
                    onClick={toggleSidebar}
                    className='lg:hidden'
                >
                    <span className='sr-only'>Toggle sidebar</span>☰
                </Button>

                <div className='relative hidden lg:flex'>
                    <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                        type='search'
                        placeholder='Search events...'
                        className='w-[300px] pl-8'
                    />
                </div>
            </div>

            <div className='flex items-center gap-4'>
                <Button
                    variant='ghost'
                    size='icon'
                >
                    <Bell className='h-4 w-4' />
                    <span className='sr-only'>Notifications</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant='ghost'
                            className='relative h-8 w-8 rounded-full'
                        >
                            <Avatar className='h-8 w-8'>
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='w-56'
                        align='end'
                        forceMount
                    >
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuItem>Sign out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};
