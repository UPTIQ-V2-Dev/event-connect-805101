import { Bell, Search, LogOut, User, Settings } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/services/auth';
import { getStoredUser } from '@/lib/api';

export const AppHeader = () => {
    const { toggleSidebar } = useSidebar();
    const navigate = useNavigate();
    const user = getStoredUser();

    const logoutMutation = useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            toast.success('Logged out successfully');
            navigate('/login', { replace: true });
        },
        onError: (error: any) => {
            console.error('Logout error:', error);
            toast.error('Logout failed. Please try again.');
        }
    });

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    const getUserInitials = () => {
        if (!user?.name) return 'U';
        const names = user.name.split(' ');
        return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0].slice(0, 2).toUpperCase();
    };

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
                                <AvatarFallback>{getUserInitials()}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='w-56'
                        align='end'
                        forceMount
                    >
                        <div className='flex items-center justify-start gap-2 p-2'>
                            <div className='flex flex-col space-y-1 leading-none'>
                                {user?.name && <p className='font-medium'>{user.name}</p>}
                                <p className='w-[200px] truncate text-sm text-muted-foreground'>{user?.email}</p>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className='mr-2 h-4 w-4' />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to='/settings'>
                                <Settings className='mr-2 h-4 w-4' />
                                Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            disabled={logoutMutation.isPending}
                        >
                            <LogOut className='mr-2 h-4 w-4' />
                            {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};
