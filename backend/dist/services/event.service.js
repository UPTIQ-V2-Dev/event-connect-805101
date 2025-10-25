import prisma from "../client.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
/**
 * Create an event
 */
const createEvent = async (eventData, createdBy) => {
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
const queryEvents = async (filter, options) => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';
    // Build where clause
    const where = {};
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
const getRecentEvents = async (createdBy, limit = 10) => {
    const where = {};
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
const getEventById = async (eventId) => {
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
const updateEventById = async (eventId, updateData, userId) => {
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
    const updatePayload = {};
    if (updateData.title !== undefined)
        updatePayload.title = updateData.title;
    if (updateData.description !== undefined)
        updatePayload.description = updateData.description;
    if (updateData.startDate !== undefined)
        updatePayload.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined)
        updatePayload.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.locationType !== undefined)
        updatePayload.locationType = updateData.locationType;
    if (updateData.address !== undefined)
        updatePayload.address = updateData.address;
    if (updateData.virtualLink !== undefined)
        updatePayload.virtualLink = updateData.virtualLink;
    if (updateData.capacity !== undefined)
        updatePayload.capacity = updateData.capacity;
    if (updateData.rsvpDeadline !== undefined)
        updatePayload.rsvpDeadline = updateData.rsvpDeadline ? new Date(updateData.rsvpDeadline) : null;
    if (updateData.visibility !== undefined)
        updatePayload.visibility = updateData.visibility;
    if (updateData.status !== undefined)
        updatePayload.status = updateData.status;
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
const deleteEventById = async (eventId, userId) => {
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
function calculateRsvpStats(attendees) {
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
function formatEventWithStats(event) {
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
