import prisma from "../client.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
/**
 * Create a message
 * @param {CreateMessageInput} messageData
 * @returns {Promise<Message>}
 */
const createMessage = async (messageData) => {
    const { eventId, subject, content, recipientFilter, scheduledDate, createdBy } = messageData;
    // Verify event exists and user is the creator
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    if (event.createdBy !== createdBy) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Only event creators can send messages to their events');
    }
    // Calculate recipient count based on filters
    const recipientCount = await calculateRecipientCount(eventId, recipientFilter);
    // Validate scheduled date if provided
    if (scheduledDate && new Date(scheduledDate) <= new Date()) {
        throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Scheduled date must be in the future');
    }
    // Determine delivery status
    const deliveryStatus = scheduledDate ? 'scheduled' : 'sent';
    const sentDate = scheduledDate ? null : new Date();
    return prisma.message.create({
        data: {
            eventId,
            subject,
            content,
            recipientCount,
            deliveryStatus,
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
            sentDate,
            createdBy,
            rsvpStatusFilter: recipientFilter.rsvpStatus ? recipientFilter.rsvpStatus.join(',') : null,
            searchQuery: recipientFilter.searchQuery || null,
            dateRangeStart: recipientFilter.registrationDateRange?.start
                ? new Date(recipientFilter.registrationDateRange.start)
                : null,
            dateRangeEnd: recipientFilter.registrationDateRange?.end
                ? new Date(recipientFilter.registrationDateRange.end)
                : null
        }
    });
};
/**
 * Schedule a message
 * @param {CreateMessageInput} messageData
 * @returns {Promise<Message>}
 */
const scheduleMessage = async (messageData) => {
    if (!messageData.scheduledDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Scheduled date is required for scheduling messages');
    }
    return await createMessage(messageData);
};
/**
 * Calculate recipient count based on filters
 * @param {string} eventId
 * @param {RecipientFilter} recipientFilter
 * @returns {Promise<number>}
 */
const calculateRecipientCount = async (eventId, recipientFilter) => {
    const where = {
        eventId
    };
    // Apply RSVP status filter
    if (recipientFilter.rsvpStatus && recipientFilter.rsvpStatus.length > 0) {
        where.rsvpStatus = {
            in: recipientFilter.rsvpStatus
        };
    }
    // Apply registration date range filter
    if (recipientFilter.registrationDateRange) {
        where.registrationDate = {};
        if (recipientFilter.registrationDateRange.start) {
            where.registrationDate.gte = new Date(recipientFilter.registrationDateRange.start);
        }
        if (recipientFilter.registrationDateRange.end) {
            where.registrationDate.lte = new Date(recipientFilter.registrationDateRange.end);
        }
    }
    // Apply search query filter
    if (recipientFilter.searchQuery) {
        where.OR = [
            { name: { contains: recipientFilter.searchQuery, mode: 'insensitive' } },
            { email: { contains: recipientFilter.searchQuery, mode: 'insensitive' } },
            { company: { contains: recipientFilter.searchQuery, mode: 'insensitive' } }
        ];
    }
    return await prisma.attendee.count({ where });
};
/**
 * Get messages for an event
 * @param {string} eventId
 * @param {number} userId
 * @returns {Promise<Message[]>}
 */
const getEventMessages = async (eventId, userId) => {
    // Verify event exists and user has access
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }
    if (event.createdBy !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }
    return prisma.message.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' }
    });
};
/**
 * Get message by ID
 * @param {string} messageId
 * @param {number} userId
 * @returns {Promise<Message | null>}
 */
const getMessageById = async (messageId, userId) => {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
            event: true
        }
    });
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
    }
    if (message.event.createdBy !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }
    return message;
};
/**
 * Get delivery status for a message
 * @param {string} messageId
 * @param {number} userId
 * @returns {Promise<object>}
 */
const getMessageDeliveryStatus = async (messageId, userId) => {
    const message = await getMessageById(messageId, userId);
    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
    }
    // For now, return mock delivery status data
    // In a real implementation, this would come from an email service provider
    const totalRecipients = message.recipientCount;
    const delivered = Math.floor(totalRecipients * 0.9); // 90% delivered
    const failed = Math.floor(totalRecipients * 0.05); // 5% failed
    const pending = totalRecipients - delivered - failed; // remaining pending
    return {
        messageId: message.id,
        totalRecipients,
        delivered,
        failed,
        pending,
        details: [
            // Mock delivery details - in real implementation this would come from email service
            {
                recipientEmail: 'example@example.com',
                status: 'delivered',
                timestamp: new Date().toISOString()
            }
        ]
    };
};
/**
 * Transform message data to API response format
 * @param {Message} message
 * @returns {object}
 */
const transformMessageToResponse = (message) => {
    const recipientFilter = {};
    if (message.rsvpStatusFilter) {
        recipientFilter.rsvpStatus = message.rsvpStatusFilter.split(',');
    }
    if (message.dateRangeStart || message.dateRangeEnd) {
        recipientFilter.registrationDateRange = {};
        if (message.dateRangeStart) {
            recipientFilter.registrationDateRange.start = message.dateRangeStart.toISOString();
        }
        if (message.dateRangeEnd) {
            recipientFilter.registrationDateRange.end = message.dateRangeEnd.toISOString();
        }
    }
    if (message.searchQuery) {
        recipientFilter.searchQuery = message.searchQuery;
    }
    return {
        id: message.id,
        eventId: message.eventId,
        subject: message.subject,
        content: message.content,
        recipientCount: message.recipientCount,
        deliveryStatus: message.deliveryStatus,
        scheduledDate: message.scheduledDate?.toISOString(),
        sentDate: message.sentDate?.toISOString(),
        createdBy: message.createdBy.toString(),
        createdAt: message.createdAt.toISOString(),
        recipientFilter
    };
};
export default {
    createMessage,
    scheduleMessage,
    getEventMessages,
    getMessageById,
    getMessageDeliveryStatus,
    transformMessageToResponse,
    calculateRecipientCount
};
