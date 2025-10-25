export interface Message {
    id: string;
    eventId: string;
    subject: string;
    content: string;
    recipientCount: number;
    deliveryStatus: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed';
    scheduledDate?: string;
    sentDate?: string;
    createdBy: string;
    createdAt: string;
    recipientFilter: RecipientFilter;
}

export interface CreateMessageRequest {
    eventId: string;
    subject: string;
    content: string;
    recipientFilter: RecipientFilter;
    scheduledDate?: string;
}

export interface MessageTemplate {
    id: string;
    name: string;
    subject: string;
    content: string;
    category: 'confirmation' | 'reminder' | 'update' | 'cancellation' | 'custom';
    createdAt: string;
    updatedAt: string;
}

export interface CreateMessageTemplateRequest {
    name: string;
    subject: string;
    content: string;
    category: 'confirmation' | 'reminder' | 'update' | 'cancellation' | 'custom';
}

export interface RecipientFilter {
    rsvpStatus?: ('attending' | 'notAttending' | 'maybe' | 'pending')[];
    registrationDateRange?: {
        start: string;
        end: string;
    };
    searchQuery?: string;
}

export interface RecipientGroup {
    name: string;
    count: number;
    filter: RecipientFilter;
}

export interface DeliveryStatus {
    messageId: string;
    totalRecipients: number;
    delivered: number;
    failed: number;
    pending: number;
    details: {
        recipientEmail: string;
        status: 'delivered' | 'failed' | 'pending';
        timestamp?: string;
        error?: string;
    }[];
}
