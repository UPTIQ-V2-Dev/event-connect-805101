import type { PaginatedResponse } from '@/types/api';
import type { AuthResponse, User } from '@/types/user';
import type { Event, DashboardStats, RecentEvent, Attendee } from '@/types/event';
import type { Message, MessageTemplate } from '@/types/communication';

export const mockUser: User = {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'USER',
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const mockAdminUser: User = {
    id: '2',
    email: 'admin@example.com',
    name: 'Jane Smith',
    role: 'ADMIN',
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const mockUsers: User[] = [mockUser, mockAdminUser];

export const mockAuthResponse: AuthResponse = {
    user: mockUser,
    tokens: {
        access: {
            token: 'mock-access-token',
            expires: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        },
        refresh: {
            token: 'mock-refresh-token',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
    }
};

export const mockPaginatedUsers: PaginatedResponse<User> = {
    results: mockUsers,
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 2
};

// Event mock data
export const mockEvents: Event[] = [
    {
        id: '1',
        title: 'Annual Company Conference 2025',
        description:
            'Join us for our biggest company conference featuring keynote speakers, workshops, and networking opportunities.',
        startDate: '2025-11-15T09:00:00Z',
        endDate: '2025-11-15T17:00:00Z',
        location: {
            type: 'physical',
            address: '123 Conference Center, Downtown City, NY 10001'
        },
        capacity: 200,
        rsvpDeadline: '2025-11-10T23:59:59Z',
        status: 'published',
        visibility: 'public',
        createdBy: '1',
        createdAt: '2025-10-01T10:00:00Z',
        updatedAt: '2025-10-20T14:30:00Z',
        attendeeCount: 85,
        rsvpStats: {
            attending: 75,
            notAttending: 8,
            maybe: 12,
            pending: 25
        }
    },
    {
        id: '2',
        title: 'Product Launch Webinar',
        description: 'Exclusive webinar showcasing our latest product features and roadmap.',
        startDate: '2025-11-02T14:00:00Z',
        endDate: '2025-11-02T15:30:00Z',
        location: {
            type: 'virtual',
            virtualLink: 'https://zoom.us/j/1234567890'
        },
        status: 'published',
        visibility: 'public',
        createdBy: '1',
        createdAt: '2025-10-15T09:00:00Z',
        updatedAt: '2025-10-22T16:45:00Z',
        attendeeCount: 45,
        rsvpStats: {
            attending: 38,
            notAttending: 3,
            maybe: 7,
            pending: 12
        }
    },
    {
        id: '3',
        title: 'Team Building Workshop',
        description: 'Interactive workshop focused on team collaboration and communication skills.',
        startDate: '2025-11-20T10:00:00Z',
        endDate: '2025-11-20T16:00:00Z',
        location: {
            type: 'physical',
            address: 'Main Office, Conference Room A'
        },
        capacity: 30,
        rsvpDeadline: '2025-11-18T17:00:00Z',
        status: 'draft',
        visibility: 'private',
        createdBy: '1',
        createdAt: '2025-10-25T11:00:00Z',
        updatedAt: '2025-10-25T11:00:00Z',
        attendeeCount: 0,
        rsvpStats: {
            attending: 0,
            notAttending: 0,
            maybe: 0,
            pending: 0
        }
    }
];

export const mockDashboardStats: DashboardStats = {
    totalEvents: 12,
    activeEvents: 8,
    totalAttendees: 450,
    upcomingEvents: 5,
    recentActivity: {
        newRSVPs: 23,
        messagessent: 45,
        eventsCreated: 3
    }
};

export const mockRecentEvents: RecentEvent[] = [
    {
        id: '1',
        title: 'Annual Company Conference 2025',
        startDate: '2025-11-15T09:00:00Z',
        attendeeCount: 85,
        status: 'published',
        rsvpStats: {
            attending: 75,
            notAttending: 8,
            maybe: 12,
            pending: 25
        }
    },
    {
        id: '2',
        title: 'Product Launch Webinar',
        startDate: '2025-11-02T14:00:00Z',
        attendeeCount: 45,
        status: 'published',
        rsvpStats: {
            attending: 38,
            notAttending: 3,
            maybe: 7,
            pending: 12
        }
    }
];

export const mockAttendees: Attendee[] = [
    {
        id: '1',
        eventId: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        rsvpStatus: 'attending',
        registrationDate: '2025-10-20T10:00:00Z',
        guestInfo: {
            phone: '+1-555-0123',
            company: 'TechCorp Inc.'
        }
    },
    {
        id: '2',
        eventId: '1',
        name: 'Bob Smith',
        email: 'bob@example.com',
        rsvpStatus: 'maybe',
        dietaryRequirements: 'Vegetarian',
        registrationDate: '2025-10-21T15:30:00Z'
    },
    {
        id: '3',
        eventId: '1',
        name: 'Carol Williams',
        email: 'carol@example.com',
        rsvpStatus: 'attending',
        registrationDate: '2025-10-22T09:45:00Z',
        guestInfo: {
            company: 'Design Studio'
        }
    }
];

export const mockMessageTemplates: MessageTemplate[] = [
    {
        id: '1',
        name: 'RSVP Confirmation',
        subject: 'Your RSVP has been confirmed',
        content:
            'Thank you for confirming your attendance to {{event.title}}. We look forward to seeing you on {{event.date}}.',
        category: 'confirmation',
        createdAt: '2025-10-01T10:00:00Z',
        updatedAt: '2025-10-01T10:00:00Z'
    },
    {
        id: '2',
        name: 'Event Reminder',
        subject: 'Reminder: {{event.title}} is tomorrow',
        content: 'This is a friendly reminder that {{event.title}} is scheduled for tomorrow at {{event.time}}.',
        category: 'reminder',
        createdAt: '2025-10-01T10:00:00Z',
        updatedAt: '2025-10-01T10:00:00Z'
    }
];

export const mockMessages: Message[] = [
    {
        id: '1',
        eventId: '1',
        subject: 'Welcome to Annual Company Conference 2025',
        content:
            'Thank you for registering for our annual conference. Please find the agenda and important details attached.',
        recipientCount: 75,
        deliveryStatus: 'delivered',
        sentDate: '2025-10-23T10:00:00Z',
        createdBy: '1',
        createdAt: '2025-10-23T09:30:00Z',
        recipientFilter: {
            rsvpStatus: ['attending']
        }
    }
];

export const mockPaginatedEvents: PaginatedResponse<Event> = {
    results: mockEvents,
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: mockEvents.length
};
