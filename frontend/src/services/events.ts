import { api } from '@/lib/api';
import { mockApiDelay } from '@/lib/utils';
import type {
    Event,
    CreateEventRequest,
    UpdateEventRequest,
    EventFilters,
    DashboardStats,
    RecentEvent,
    Attendee,
    CreateAttendeeRequest
} from '@/types/event';
import type { PaginatedResponse } from '@/types/api';
import { mockEvents, mockDashboardStats, mockRecentEvents, mockAttendees, mockPaginatedEvents } from '@/data/mockData';

export const eventService = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getDashboardStats ---');
            await mockApiDelay();
            return mockDashboardStats;
        }
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    getRecentEvents: async (): Promise<RecentEvent[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getRecentEvents ---');
            await mockApiDelay();
            return mockRecentEvents;
        }
        const response = await api.get('/events/recent');
        return response.data;
    },

    getEvents: async (filters?: EventFilters): Promise<PaginatedResponse<Event>> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getEvents ---', filters);
            await mockApiDelay();
            // Simple filtering for mock data
            let filteredEvents = [...mockEvents];

            if (filters?.status) {
                filteredEvents = filteredEvents.filter(event => event.status === filters.status);
            }

            if (filters?.search) {
                const search = filters.search.toLowerCase();
                filteredEvents = filteredEvents.filter(
                    event =>
                        event.title.toLowerCase().includes(search) || event.description.toLowerCase().includes(search)
                );
            }

            if (filters?.visibility) {
                filteredEvents = filteredEvents.filter(event => event.visibility === filters.visibility);
            }

            return {
                ...mockPaginatedEvents,
                results: filteredEvents,
                totalResults: filteredEvents.length
            };
        }

        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.visibility) params.append('visibility', filters.visibility);
        if (filters?.dateRange?.start) params.append('dateStart', filters.dateRange.start);
        if (filters?.dateRange?.end) params.append('dateEnd', filters.dateRange.end);

        const response = await api.get(`/events?${params.toString()}`);
        return response.data;
    },

    getEventById: async (id: string): Promise<Event> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getEventById ---', id);
            await mockApiDelay();
            const event = mockEvents.find(e => e.id === id);
            if (!event) {
                throw new Error('Event not found');
            }
            return event;
        }
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    createEvent: async (eventData: CreateEventRequest): Promise<Event> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: createEvent ---', eventData);
            await mockApiDelay();
            const newEvent: Event = {
                id: Math.random().toString(36).substr(2, 9),
                ...eventData,
                status: 'draft',
                createdBy: '1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                attendeeCount: 0,
                rsvpStats: {
                    attending: 0,
                    notAttending: 0,
                    maybe: 0,
                    pending: 0
                }
            };
            return newEvent;
        }
        const response = await api.post('/events', eventData);
        return response.data;
    },

    updateEvent: async (id: string, eventData: UpdateEventRequest): Promise<Event> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: updateEvent ---', id, eventData);
            await mockApiDelay();
            const existingEvent = mockEvents.find(e => e.id === id);
            if (!existingEvent) {
                throw new Error('Event not found');
            }
            return {
                ...existingEvent,
                ...eventData,
                updatedAt: new Date().toISOString()
            };
        }
        const response = await api.put(`/events/${id}`, eventData);
        return response.data;
    },

    deleteEvent: async (id: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: deleteEvent ---', id);
            await mockApiDelay();
            return;
        }
        await api.delete(`/events/${id}`);
    },

    getEventAttendees: async (eventId: string): Promise<Attendee[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getEventAttendees ---', eventId);
            await mockApiDelay();
            return mockAttendees.filter(attendee => attendee.eventId === eventId);
        }
        const response = await api.get(`/events/${eventId}/attendees`);
        return response.data;
    },

    createRSVP: async (rsvpData: CreateAttendeeRequest): Promise<Attendee> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: createRSVP ---', rsvpData);
            await mockApiDelay();
            const newAttendee: Attendee = {
                id: Math.random().toString(36).substr(2, 9),
                ...rsvpData,
                registrationDate: new Date().toISOString()
            };
            return newAttendee;
        }
        const response = await api.post('/rsvp', rsvpData);
        return response.data;
    },

    updateAttendeeStatus: async (
        eventId: string,
        attendeeId: string,
        status: 'attending' | 'notAttending' | 'maybe'
    ): Promise<Attendee> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: updateAttendeeStatus ---', eventId, attendeeId, status);
            await mockApiDelay();
            const attendee = mockAttendees.find(a => a.id === attendeeId && a.eventId === eventId);
            if (!attendee) {
                throw new Error('Attendee not found');
            }
            return {
                ...attendee,
                rsvpStatus: status
            };
        }
        const response = await api.put(`/events/${eventId}/attendees/${attendeeId}/status`, { status });
        return response.data;
    }
};
