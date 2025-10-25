import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EventsPage } from '@/pages/EventsPage';
import { AttendeesPage } from '@/pages/AttendeesPage';
import { CommunicationsPage } from '@/pages/CommunicationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { isAuthenticated } from '@/lib/api';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000 // 5 minutes
        }
    }
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated() ? (
        children
    ) : (
        <Navigate
            to='/login'
            replace
        />
    );
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    return !isAuthenticated() ? (
        children
    ) : (
        <Navigate
            to='/dashboard'
            replace
        />
    );
};

export const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <div className='min-h-screen bg-background'>
                    <Routes>
                        <Route
                            path='/login'
                            element={
                                <PublicRoute>
                                    <LoginPage />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path='/'
                            element={
                                <Navigate
                                    to={isAuthenticated() ? '/dashboard' : '/login'}
                                    replace
                                />
                            }
                        />
                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppLayout />
                                </ProtectedRoute>
                            }
                        >
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
