import { dashboardService } from "../services/index.js";
import { z } from 'zod';
const recentActivitySchema = z.object({
    newRSVPs: z.number(),
    messagesSent: z.number(),
    eventsCreated: z.number()
});
const dashboardStatsSchema = z.object({
    totalEvents: z.number(),
    activeEvents: z.number(),
    totalAttendees: z.number(),
    upcomingEvents: z.number(),
    recentActivity: recentActivitySchema
});
const getDashboardStatsTool = {
    id: 'dashboard_get_stats',
    name: 'Get Dashboard Statistics',
    description: 'Get dashboard statistics and metrics for a user including events, attendees, and recent activity',
    inputSchema: z.object({
        userId: z.number().int()
    }),
    outputSchema: dashboardStatsSchema,
    fn: async (inputs) => {
        const stats = await dashboardService.getDashboardStats(inputs.userId);
        return stats;
    }
};
export const dashboardTools = [getDashboardStatsTool];
