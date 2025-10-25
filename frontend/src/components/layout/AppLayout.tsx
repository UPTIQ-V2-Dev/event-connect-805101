import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

export const AppLayout = () => {
    return (
        <SidebarProvider>
            <div className='flex min-h-screen w-full'>
                <AppSidebar />
                <div className='flex flex-1 flex-col'>
                    <AppHeader />
                    <main className='flex-1 overflow-auto bg-muted/40 p-6'>
                        <Outlet />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};
