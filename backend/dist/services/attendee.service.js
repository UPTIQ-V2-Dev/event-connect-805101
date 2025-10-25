import prisma from "../client.js";
import { Prisma } from '../generated/prisma/index.js';
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
/**
 * Create RSVP for an event (public endpoint)
 */
const createRsvp = async (rsvpData) => {
    // Check if event exists
    const event = await prisma.event.findUnique({
        where: { id: rsvpData.eventId },
        include: { _count: { select: { attendees: true } } }
    });
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    // Check if event is published and accepting RSVPs
    if (event.status !== 'published') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Event is not published and not accepting RSVPs');
    }
    // Check RSVP deadline
    if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'RSVP deadline has passed');
    }
    // Check capacity for "attending" status
    if (rsvpData.rsvpStatus === 'attending' && event.capacity) {
        const currentAttendingCount = await prisma.attendee.count({
            where: {
                eventId: rsvpData.eventId,
                rsvpStatus: 'attending'
            }
        });
        if (currentAttendingCount >= event.capacity) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Event capacity reached');
        }
    }
    try {
        const attendee = await prisma.attendee.create({
            data: {
                eventId: rsvpData.eventId,
                name: rsvpData.name,
                email: rsvpData.email,
                rsvpStatus: rsvpData.rsvpStatus,
                dietaryRequirements: rsvpData.dietaryRequirements,
                phone: rsvpData.guestInfo?.phone,
                company: rsvpData.guestInfo?.company
            }
        });
        return formatAttendeeWithGuestInfo(attendee);
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ApiError(httpStatus.CONFLICT, 'RSVP already exists for this email and event');
        }
        throw error;
    }
};
/**
 * Get attendees for a specific event
 */
const getEventAttendees = async (eventId) => {
    // Check if event exists
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    const attendees = await prisma.attendee.findMany({
        where: { eventId },
        orderBy: { registrationDate: 'asc' }
    });
    return attendees.map(attendee => formatAttendeeWithGuestInfo(attendee));
};
/**
 * Update attendee RSVP status (auth required - only event creator)
 */
const updateAttendeeStatus = async (eventId, attendeeId, status, userId) => {
    // Check if event exists and user is the creator
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    if (event.createdBy !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only event creators can update attendee status');
    }
    // Check if attendee exists for this event
    const existingAttendee = await prisma.attendee.findFirst({
        where: {
            id: attendeeId,
            eventId: eventId
        }
    });
    if (!existingAttendee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Attendee not found for this event');
    }
    // Check capacity constraints when changing to "attending"
    if (status === 'attending' && existingAttendee.rsvpStatus !== 'attending' && event.capacity) {
        const currentAttendingCount = await prisma.attendee.count({
            where: {
                eventId: eventId,
                rsvpStatus: 'attending'
            }
        });
        if (currentAttendingCount >= event.capacity) {
            throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Event capacity reached');
        }
    }
    const updatedAttendee = await prisma.attendee.update({
        where: { id: attendeeId },
        data: { rsvpStatus: status }
    });
    return formatAttendeeWithGuestInfo(updatedAttendee);
};
/**
 * Get attendee by ID
 */
const getAttendeeById = async (attendeeId) => {
    const attendee = await prisma.attendee.findUnique({
        where: { id: attendeeId }
    });
    if (!attendee) {
        return null;
    }
    return formatAttendeeWithGuestInfo(attendee);
};
/**
 * Query attendees with filters
 */
const queryAttendees = async (filter, options) => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'registrationDate';
    const sortType = options.sortType ?? 'desc';
    const where = {};
    if (filter.eventId) {
        where.eventId = filter.eventId;
    }
    if (filter.rsvpStatus) {
        where.rsvpStatus = filter.rsvpStatus;
    }
    if (filter.email) {
        where.email = { contains: filter.email, mode: 'insensitive' };
    }
    const attendees = await prisma.attendee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType }
    });
    return attendees.map(attendee => formatAttendeeWithGuestInfo(attendee));
};
/**
 * Delete attendee by ID (for cleanup purposes)
 */
const deleteAttendeeById = async (attendeeId) => {
    const attendee = await getAttendeeById(attendeeId);
    if (!attendee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Attendee not found');
    }
    await prisma.attendee.delete({
        where: { id: attendeeId }
    });
    return attendee;
};
/**
 * Helper function to format attendee with guest info structure
 */
function formatAttendeeWithGuestInfo(attendee) {
    return {
        id: attendee.id,
        eventId: attendee.eventId,
        name: attendee.name,
        email: attendee.email,
        rsvpStatus: attendee.rsvpStatus,
        dietaryRequirements: attendee.dietaryRequirements,
        registrationDate: attendee.registrationDate,
        guestInfo: {
            phone: attendee.phone || undefined,
            company: attendee.company || undefined
        }
    };
}
export default {
    createRsvp,
    getEventAttendees,
    updateAttendeeStatus,
    getAttendeeById,
    queryAttendees,
    deleteAttendeeById
};
