import { Request, Response, NextFunction } from 'express';
import { Event, Attendee, User, Message } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { DashboardStats } from '../types';

class DashboardController {
    // Get dashboard statistics
    static getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id;
        const userRole = req.user!.role;

        // Build match criteria based on user role
        const eventMatchCriteria =
            userRole === 'admin'
                ? {} // Admin can see all events
                : { organizer: userId }; // Others see only their events

        // Get basic counts
        const [totalEvents, upcomingEvents, totalUsers, recentEventsData, rsvpStatsData] = await Promise.all([
            // Total events
            Event.countDocuments(eventMatchCriteria),

            // Upcoming events
            Event.countDocuments({
                ...eventMatchCriteria,
                startDate: { $gt: new Date() },
                status: { $in: ['published', 'draft'] }
            }),

            // Total users (admin only)
            userRole === 'admin' ? User.countDocuments({ isActive: true }) : 0,

            // Recent events (last 10)
            Event.aggregate([
                { $match: eventMatchCriteria },
                { $sort: { createdAt: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'attendees',
                        localField: '_id',
                        foreignField: 'event',
                        as: 'attendees'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        startDate: 1,
                        status: 1,
                        isPublic: 1,
                        attendeeCount: { $size: '$attendees' },
                        createdAt: 1
                    }
                }
            ]),

            // RSVP statistics across all user's events
            Event.aggregate([
                { $match: eventMatchCriteria },
                {
                    $lookup: {
                        from: 'attendees',
                        localField: '_id',
                        foreignField: 'event',
                        as: 'attendees'
                    }
                },
                { $unwind: { path: '$attendees', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$attendees.rsvpStatus',
                        count: { $sum: { $cond: [{ $ifNull: ['$attendees._id', false] }, 1, 0] } }
                    }
                }
            ])
        ]);

        // Calculate total attendees
        const totalAttendees = rsvpStatsData.reduce((sum, stat) => sum + stat.count, 0);

        // Format RSVP stats
        const rsvpStats = {
            attending: 0,
            notAttending: 0,
            maybe: 0,
            pending: 0
        };

        rsvpStatsData.forEach(stat => {
            if (stat._id && stat._id in rsvpStats) {
                rsvpStats[stat._id as keyof typeof rsvpStats] = stat.count;
            }
        });

        // Get additional statistics for admins
        let additionalStats = {};
        if (userRole === 'admin') {
            const [messageCount, activeOrganizerCount] = await Promise.all([
                Message.countDocuments(),
                User.countDocuments({ role: { $in: ['organizer', 'admin'] }, isActive: true })
            ]);

            additionalStats = {
                totalMessages: messageCount,
                activeOrganizers: activeOrganizerCount
            };
        }

        const dashboardStats: DashboardStats = {
            totalEvents,
            upcomingEvents,
            totalAttendees,
            totalUsers,
            recentEvents: recentEventsData,
            rsvpStats
        };

        res.json({
            success: true,
            data: {
                ...dashboardStats,
                ...additionalStats
            }
        });
    });

    // Get event statistics over time
    static getEventStatsOverTime = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { period = '30days' } = req.query;
        const userId = req.user!._id;
        const userRole = req.user!.role;

        // Calculate date range
        let dateRange: Date;
        let groupBy: any;

        switch (period) {
            case '7days':
                dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
                break;
            case '30days':
                dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
                break;
            case '12months':
                dateRange = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                groupBy = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
            default:
                return next(new AppError('Invalid period specified', 400));
        }

        // Build match criteria
        const matchCriteria =
            userRole === 'admin'
                ? { createdAt: { $gte: dateRange } }
                : { organizer: userId, createdAt: { $gte: dateRange } };

        const eventStats = await Event.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: groupBy,
                    events: { $sum: 1 },
                    publishedEvents: {
                        $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: eventStats
        });
    });

    // Get RSVP trends
    static getRSVPTrends = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { period = '30days' } = req.query;
        const userId = req.user!._id;
        const userRole = req.user!.role;

        // Calculate date range
        let dateRange: Date;
        switch (period) {
            case '7days':
                dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30days':
                dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '12months':
                dateRange = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                return next(new AppError('Invalid period specified', 400));
        }

        // Build pipeline to get RSVP trends
        const pipeline: any[] = [
            {
                $lookup: {
                    from: 'events',
                    localField: 'event',
                    foreignField: '_id',
                    as: 'eventInfo'
                }
            },
            { $unwind: '$eventInfo' }
        ];

        // Filter by user's events if not admin
        if (userRole !== 'admin') {
            pipeline.push({
                $match: { 'eventInfo.organizer': userId }
            });
        }

        pipeline.push(
            {
                $match: { rsvpDate: { $gte: dateRange } }
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: period === '12months' ? '%Y-%m' : '%Y-%m-%d',
                                date: '$rsvpDate'
                            }
                        },
                        rsvpStatus: '$rsvpStatus'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.date',
                    rsvps: {
                        $push: {
                            status: '$_id.rsvpStatus',
                            count: '$count'
                        }
                    },
                    total: { $sum: '$count' }
                }
            },
            { $sort: { _id: 1 } }
        );

        const rsvpTrends = await Attendee.aggregate(pipeline);

        res.json({
            success: true,
            data: rsvpTrends
        });
    });

    // Get upcoming events summary
    static getUpcomingEventsSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id;
        const userRole = req.user!.role;

        const matchCriteria =
            userRole === 'admin'
                ? {
                      startDate: { $gt: new Date() },
                      status: { $in: ['published', 'draft'] }
                  }
                : {
                      organizer: userId,
                      startDate: { $gt: new Date() },
                      status: { $in: ['published', 'draft'] }
                  };

        const upcomingEvents = await Event.aggregate([
            { $match: matchCriteria },
            { $sort: { startDate: 1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'attendees',
                    localField: '_id',
                    foreignField: 'event',
                    as: 'attendees'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    startDate: 1,
                    endDate: 1,
                    status: 1,
                    location: 1,
                    capacity: 1,
                    attendeeCount: {
                        total: { $size: '$attendees' },
                        attending: {
                            $size: {
                                $filter: {
                                    input: '$attendees',
                                    cond: { $eq: ['$$this.rsvpStatus', 'attending'] }
                                }
                            }
                        }
                    },
                    daysUntil: {
                        $ceil: {
                            $divide: [
                                { $subtract: ['$startDate', new Date()] },
                                1000 * 60 * 60 * 24 // Convert to days
                            ]
                        }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: upcomingEvents
        });
    });

    // Get performance metrics
    static getPerformanceMetrics = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.user!._id;
        const userRole = req.user!.role;

        const eventMatchCriteria = userRole === 'admin' ? {} : { organizer: userId };

        const [eventPerformance, averageAttendance, popularCategories] = await Promise.all([
            // Event performance (completion rate, cancellation rate)
            Event.aggregate([
                { $match: eventMatchCriteria },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                        published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } }
                    }
                }
            ]),

            // Average attendance rate
            Event.aggregate([
                { $match: { ...eventMatchCriteria, status: 'completed' } },
                {
                    $project: {
                        attendanceRate: {
                            $cond: [
                                { $gt: ['$attendeeCount.attending', 0] },
                                {
                                    $divide: [
                                        '$attendeeCount.total', // Actual attendees
                                        '$attendeeCount.attending' // Expected attendees
                                    ]
                                },
                                0
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageAttendanceRate: { $avg: '$attendanceRate' }
                    }
                }
            ]),

            // Popular event categories
            Event.aggregate([
                { $match: eventMatchCriteria },
                { $unwind: '$categories' },
                {
                    $group: {
                        _id: '$categories',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        const performance = eventPerformance[0] || {
            total: 0,
            completed: 0,
            cancelled: 0,
            published: 0,
            draft: 0
        };

        const attendance = averageAttendance[0] || { averageAttendanceRate: 0 };

        res.json({
            success: true,
            data: {
                eventPerformance: {
                    ...performance,
                    completionRate:
                        performance.total > 0 ? ((performance.completed / performance.total) * 100).toFixed(1) : '0',
                    cancellationRate:
                        performance.total > 0 ? ((performance.cancelled / performance.total) * 100).toFixed(1) : '0'
                },
                averageAttendanceRate: (attendance.averageAttendanceRate * 100).toFixed(1),
                popularCategories
            }
        });
    });
}

export default DashboardController;
