export interface Event {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: {
        type: 'physical' | 'virtual' | 'hybrid';
        address?: string;
        virtualLink?: string;
    };
    capacity?: number;
    rsvpDeadline?: string;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    visibility: 'public' | 'private';
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    attendeeCount: number;
    rsvpStats: {
        attending: number;
        notAttending: number;
        maybe: number;
        pending: number;
    };
}

export interface CreateEventRequest {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: {
        type: 'physical' | 'virtual' | 'hybrid';
        address?: string;
        virtualLink?: string;
    };
    capacity?: number;
    rsvpDeadline?: string;
    visibility: 'public' | 'private';
}

export interface UpdateEventRequest {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: {
        type: 'physical' | 'virtual' | 'hybrid';
        address?: string;
        virtualLink?: string;
    };
    capacity?: number;
    rsvpDeadline?: string;
    visibility?: 'public' | 'private';
}

export interface EventFilters {
    status?: 'draft' | 'published' | 'cancelled' | 'completed';
    dateRange?: {
        start: string;
        end: string;
    };
    search?: string;
    visibility?: 'public' | 'private';
}

export interface Attendee {
    id: string;
    eventId: string;
    name: string;
    email: string;
    rsvpStatus: 'attending' | 'notAttending' | 'maybe' | 'pending';
    dietaryRequirements?: string;
    registrationDate: string;
    guestInfo?: {
        phone?: string;
        company?: string;
    };
}

export interface RSVPFormData {
    name: string;
    email: string;
    rsvpStatus: 'attending' | 'notAttending' | 'maybe';
    dietaryRequirements?: string;
    guestInfo?: {
        phone?: string;
        company?: string;
    };
}

export interface CreateAttendeeRequest {
    eventId: string;
    name: string;
    email: string;
    rsvpStatus: 'attending' | 'notAttending' | 'maybe';
    dietaryRequirements?: string;
    guestInfo?: {
        phone?: string;
        company?: string;
    };
}

export interface DashboardStats {
    totalEvents: number;
    activeEvents: number;
    totalAttendees: number;
    upcomingEvents: number;
    recentActivity: {
        newRSVPs: number;
        messagessent: number;
        eventsCreated: number;
    };
}

export interface RecentEvent {
    id: string;
    title: string;
    startDate: string;
    attendeeCount: number;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    rsvpStats: {
        attending: number;
        notAttending: number;
        maybe: number;
        pending: number;
    };
}

export interface PublicEvent {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: {
        type: 'physical' | 'virtual' | 'hybrid';
        address?: string;
        virtualLink?: string;
    };
    capacity?: number;
    rsvpDeadline?: string;
    attendeeCount: number;
}
