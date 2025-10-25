import prisma from "../client.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
/**
 * Get dashboard statistics for a user
 * @param {number} userId - The user ID to get statistics for
 * @returns {Promise<DashboardStats>}
 */
const getDashboardStats = async (userId) => {
    try {
        // Get current date for calculating recent activity (last 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Get all user's events
        const userEvents = await prisma.event.findMany({
            where: { createdBy: userId },
            include: {
                attendees: true,
                messages: true
            }
        });
        const eventIds = userEvents.map(event => event.id);
        // Calculate total events
        const totalEvents = userEvents.length;
        // Calculate active events (published or active status)
        const activeEvents = userEvents.filter(event => event.status === 'published' || event.status === 'active').length;
        // Calculate total attendees across all user's events
        const totalAttendees = await prisma.attendee.count({
            where: {
                eventId: { in: eventIds }
            }
        });
        // Calculate upcoming events (events with startDate in the future)
        const upcomingEvents = userEvents.filter(event => new Date(event.startDate) > now).length;
        // Calculate recent activity (last 30 days)
        // New RSVPs in last 30 days
        const newRSVPs = await prisma.attendee.count({
            where: {
                eventId: { in: eventIds },
                registrationDate: { gte: thirtyDaysAgo }
            }
        });
        // Messages sent in last 30 days
        const messagesSent = await prisma.message.count({
            where: {
                eventId: { in: eventIds },
                createdBy: userId,
                sentDate: {
                    gte: thirtyDaysAgo,
                    not: null
                }
            }
        });
        // Events created in last 30 days
        const eventsCreated = userEvents.filter(event => new Date(event.createdAt) >= thirtyDaysAgo).length;
        return {
            totalEvents,
            activeEvents,
            totalAttendees,
            upcomingEvents,
            recentActivity: {
                newRSVPs,
                messagesSent,
                eventsCreated
            }
        };
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error calculating dashboard statistics');
    }
};
export default {
    getDashboardStats
};
