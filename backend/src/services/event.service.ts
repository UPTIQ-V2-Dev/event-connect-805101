import prisma from '../client.ts';
import { Prisma } from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import httpStatus from 'http-status';

// Type for event with calculated fields
export interface EventWithStats {
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date | null;
    locationType: string;
    address: string | null;
    virtualLink: string | null;
    capacity: number | null;
    rsvpDeadline: Date | null;
    status: string;
    visibility: string;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
    attendeeCount: number;
    rsvpStats: {
        attending: number;
        notAttending: number;
        maybe: number;
        pending: number;
    };
    location: {
        type: string;
        address?: string;
        virtualLink?: string;
    };
}

/**
 * Create an event
 */
const createEvent = async (
    eventData: {
        title: string;
        description: string;
        startDate: Date | string;
        endDate?: Date | string;
        locationType: string;
        address?: string;
        virtualLink?: string;
        capacity?: number;
        rsvpDeadline?: Date | string;
        visibility: string;
    },
    createdBy: number
): Promise<EventWithStats> => {
    const event = await prisma.event.create({
        data: {
            title: eventData.title,
            description: eventData.description,
            startDate: new Date(eventData.startDate),
            endDate: eventData.endDate ? new Date(eventData.endDate) : null,
            locationType: eventData.locationType,
            address: eventData.address,
            virtualLink: eventData.virtualLink,
            capacity: eventData.capacity,
            rsvpDeadline: eventData.rsvpDeadline ? new Date(eventData.rsvpDeadline) : null,
            visibility: eventData.visibility,
            createdBy: createdBy
        },
        include: {
            attendees: true,
            _count: {
                select: { attendees: true }
            }
        }
    });

    return formatEventWithStats(event);
};

/**
 * Query events with filtering and pagination
 */
const queryEvents = async (
    filter: {
        status?: string;
        search?: string;
        visibility?: string;
        dateStart?: string;
        dateEnd?: string;
        createdBy?: number;
    },
    options: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
    }
): Promise<{
    results: EventWithStats[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
}> => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    // Build where clause
    const where: Prisma.EventWhereInput = {};

    if (filter.status) {
        where.status = filter.status;
    }

    if (filter.visibility) {
        where.visibility = filter.visibility;
    }

    if (filter.createdBy) {
        where.createdBy = filter.createdBy;
    }

    if (filter.search) {
        where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } }
        ];
    }

    if (filter.dateStart || filter.dateEnd) {
        where.startDate = {};
        if (filter.dateStart) {
            where.startDate.gte = new Date(filter.dateStart);
        }
        if (filter.dateEnd) {
            where.startDate.lte = new Date(filter.dateEnd);
        }
    }

    // Get total count
    const totalResults = await prisma.event.count({ where });
    const totalPages = Math.ceil(totalResults / limit);

    // Get events with attendees
    const events = await prisma.event.findMany({
        where,
        include: {
            attendees: true,
            _count: {
                select: { attendees: true }
            }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType }
    });

    const results = events.map(event => formatEventWithStats(event));

    return {
        results,
        page,
        limit,
        totalPages,
        totalResults
    };
};

/**
 * Get recent events for dashboard
 */
const getRecentEvents = async (createdBy?: number, limit: number = 10) => {
    const where: Prisma.EventWhereInput = {};
    if (createdBy) {
        where.createdBy = createdBy;
    }

    const events = await prisma.event.findMany({
        where,
        include: {
            attendees: true,
            _count: {
                select: { attendees: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
    });

    return events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        attendeeCount: event._count.attendees,
        status: event.status,
        rsvpStats: calculateRsvpStats(event.attendees)
    }));
};

/**
 * Get event by ID
 */
const getEventById = async (eventId: string): Promise<EventWithStats | null> => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            attendees: true,
            _count: {
                select: { attendees: true }
            }
        }
    });

    if (!event) {
        return null;
    }

    return formatEventWithStats(event);
};

/**
 * Update event by ID
 */
const updateEventById = async (
    eventId: string,
    updateData: Partial<{
        title: string;
        description: string;
        startDate: Date | string;
        endDate: Date | string;
        locationType: string;
        address: string;
        virtualLink: string;
        capacity: number;
        rsvpDeadline: Date | string;
        visibility: string;
        status: string;
    }>,
    userId: number
): Promise<EventWithStats> => {
    // Check if event exists and user has permission
    const existingEvent = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!existingEvent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }

    if (existingEvent.createdBy !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot update event created by another user');
    }

    // Prepare update data
    const updatePayload: Prisma.EventUpdateInput = {};

    if (updateData.title !== undefined) updatePayload.title = updateData.title;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.startDate !== undefined) updatePayload.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined)
        updatePayload.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.locationType !== undefined) updatePayload.locationType = updateData.locationType;
    if (updateData.address !== undefined) updatePayload.address = updateData.address;
    if (updateData.virtualLink !== undefined) updatePayload.virtualLink = updateData.virtualLink;
    if (updateData.capacity !== undefined) updatePayload.capacity = updateData.capacity;
    if (updateData.rsvpDeadline !== undefined)
        updatePayload.rsvpDeadline = updateData.rsvpDeadline ? new Date(updateData.rsvpDeadline) : null;
    if (updateData.visibility !== undefined) updatePayload.visibility = updateData.visibility;
    if (updateData.status !== undefined) updatePayload.status = updateData.status;

    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: updatePayload,
        include: {
            attendees: true,
            _count: {
                select: { attendees: true }
            }
        }
    });

    return formatEventWithStats(updatedEvent);
};

/**
 * Delete event by ID
 */
const deleteEventById = async (eventId: string, userId: number): Promise<void> => {
    // Check if event exists and user has permission
    const existingEvent = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!existingEvent) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }

    if (existingEvent.createdBy !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot delete event created by another user');
    }

    await prisma.event.delete({
        where: { id: eventId }
    });
};

/**
 * Helper function to calculate RSVP stats
 */
function calculateRsvpStats(attendees: any[]) {
    return {
        attending: attendees.filter(a => a.rsvpStatus === 'attending').length,
        notAttending: attendees.filter(a => a.rsvpStatus === 'notAttending').length,
        maybe: attendees.filter(a => a.rsvpStatus === 'maybe').length,
        pending: attendees.filter(a => a.rsvpStatus === 'pending').length
    };
}

/**
 * Helper function to format event with stats and location
 */
function formatEventWithStats(event: any): EventWithStats {
    return {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        locationType: event.locationType,
        address: event.address,
        virtualLink: event.virtualLink,
        capacity: event.capacity,
        rsvpDeadline: event.rsvpDeadline,
        status: event.status,
        visibility: event.visibility,
        createdBy: event.createdBy,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        attendeeCount: event._count?.attendees || 0,
        rsvpStats: calculateRsvpStats(event.attendees || []),
        location: {
            type: event.locationType,
            address: event.address || undefined,
            virtualLink: event.virtualLink || undefined
        }
    };
}

export default {
    createEvent,
    queryEvents,
    getRecentEvents,
    getEventById,
    updateEventById,
    deleteEventById
};
