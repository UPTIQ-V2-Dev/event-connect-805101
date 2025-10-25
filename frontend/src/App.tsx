import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { EventsPage } from '@/pages/EventsPage';
import { AttendeesPage } from '@/pages/AttendeesPage';
import { CommunicationsPage } from '@/pages/CommunicationsPage';
import { SettingsPage } from '@/pages/SettingsPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000 // 5 minutes
        }
    }
});

export const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <div className='min-h-screen bg-background'>
                    <Routes>
                        <Route
                            path='/'
                            element={
                                <Navigate
                                    to='/dashboard'
                                    replace
                                />
                            }
                        />
                        <Route element={<AppLayout />}>
                            <Route
                                path='/dashboard'
                                element={<DashboardPage />}
                            />
                            <Route
                                path='/events'
                                element={<EventsPage />}
                            />
                            <Route
                                path='/attendees'
                                element={<AttendeesPage />}
                            />
                            <Route
                                path='/communications'
                                element={<CommunicationsPage />}
                            />
                            <Route
                                path='/settings'
                                element={<SettingsPage />}
                            />
                        </Route>
                    </Routes>
                    <Toaster />
                </div>
            </BrowserRouter>
        </QueryClientProvider>
    );
};
