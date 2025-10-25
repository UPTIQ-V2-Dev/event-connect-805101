export interface IUser {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'organizer' | 'user';
    isEmailVerified: boolean;
    emailVerificationToken?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    refreshTokens: string[];
    lastLogin?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEvent {
    _id: string;
    title: string;
    description: string;
    organizer: string; // User ID
    startDate: Date;
    endDate: Date;
    timezone: string;
    location: {
        type: 'physical' | 'virtual' | 'hybrid';
        address?: string;
        virtualLink?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
    };
    capacity?: number;
    rsvpDeadline?: Date;
    isPublic: boolean;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    categories: string[];
    tags: string[];
    settings: {
        allowGuestInvites: boolean;
        requireApproval: boolean;
        sendReminders: boolean;
        collectDietaryRestrictions: boolean;
        collectGuestInfo: boolean;
    };
    publicRsvpToken?: string;
    attendeeCount: {
        attending: number;
        notAttending: number;
        maybe: number;
        pending: number;
        total: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface IAttendee {
    _id: string;
    event: string; // Event ID
    user?: string; // User ID (for registered users)
    guestInfo?: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    rsvpStatus: 'attending' | 'not-attending' | 'maybe' | 'pending';
    checkedIn: boolean;
    checkInTime?: Date;
    dietaryRestrictions?: string;
    additionalNotes?: string;
    invitedBy?: string; // User ID
    rsvpToken?: string;
    rsvpDate: Date;
    remindersSent: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMessage {
    _id: string;
    event: string; // Event ID
    sender: string; // User ID
    subject: string;
    content: string;
    messageType: 'announcement' | 'reminder' | 'update' | 'invitation';
    recipients: {
        type: 'all' | 'attending' | 'not-attending' | 'maybe' | 'pending' | 'custom';
        userIds?: string[];
        attendeeIds?: string[];
    };
    scheduledFor?: Date;
    sentAt?: Date;
    deliveryStatus: {
        sent: number;
        delivered: number;
        failed: number;
        pending: number;
    };
    template?: string; // MessageTemplate ID
    isScheduled: boolean;
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

export interface IMessageTemplate {
    _id: string;
    name: string;
    description?: string;
    subject: string;
    content: string;
    templateType: 'invitation' | 'reminder' | 'confirmation' | 'update' | 'cancellation' | 'custom';
    variables: string[]; // Available template variables
    isDefault: boolean;
    createdBy: string; // User ID
    createdAt: Date;
    updatedAt: Date;
}

export interface IRefreshToken {
    _id: string;
    user: string; // User ID
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

// Request/Response types
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface AuthResponse {
    user: Omit<IUser, 'password' | 'refreshTokens'>;
    accessToken: string;
    refreshToken: string;
}

export interface CreateEventRequest {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    timezone: string;
    location: IEvent['location'];
    capacity?: number;
    rsvpDeadline?: string;
    isPublic: boolean;
    categories: string[];
    tags: string[];
    settings: IEvent['settings'];
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export interface RSVPRequest {
    rsvpStatus: 'attending' | 'not-attending' | 'maybe';
    guestInfo?: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    dietaryRestrictions?: string;
    additionalNotes?: string;
}

export interface SendMessageRequest {
    subject: string;
    content: string;
    messageType: IMessage['messageType'];
    recipients: IMessage['recipients'];
    scheduledFor?: string;
    templateId?: string;
}

export interface DashboardStats {
    totalEvents: number;
    upcomingEvents: number;
    totalAttendees: number;
    totalUsers: number;
    recentEvents: Array<{
        _id: string;
        title: string;
        startDate: Date;
        attendeeCount: number;
        status: string;
    }>;
    rsvpStats: {
        attending: number;
        notAttending: number;
        maybe: number;
        pending: number;
    };
}

// Error types
export interface ApiError {
    message: string;
    statusCode: number;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}

// Pagination types
export interface PaginationQuery {
    page?: string;
    limit?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface EventFilters extends PaginationQuery {
    status?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface AttendeeFilters extends PaginationQuery {
    rsvpStatus?: string;
    checkedIn?: string;
    search?: string;
}
