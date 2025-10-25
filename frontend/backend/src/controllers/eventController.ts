import { Request, Response, NextFunction } from 'express';
import { Event, Attendee } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { EventFilters, PaginatedResponse } from '../types';
import Database from '../utils/database';
import logger from '../utils/logger';

class EventController {
    // Get all events with filtering and pagination
    static getAllEvents = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const filters = req.query as unknown as EventFilters;
        const {
            page = 1,
            limit = 10,
            sort = 'createdAt',
            order = 'desc',
            status,
            category,
            startDate,
            endDate,
            search
        } = filters;

        // Build match pipeline
        const matchPipeline: any = {};

        // If not admin, only show user's events or public events
        if (req.user?.role !== 'admin') {
            matchPipeline.$or = [{ organizer: req.user?._id }, { isPublic: true, status: 'published' }];
        }

        // Apply filters
        if (status) {
            matchPipeline.status = status;
        }

        if (category) {
            matchPipeline.categories = { $in: [category] };
        }

        if (startDate || endDate) {
            matchPipeline.startDate = {};
            if (startDate) {
                matchPipeline.startDate.$gte = new Date(startDate);
            }
            if (endDate) {
                matchPipeline.startDate.$lte = new Date(endDate);
            }
        }

        // Build aggregation pipeline
        const pipeline: any[] = [{ $match: matchPipeline }];

        // Add search if provided
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } },
                        { categories: { $in: [new RegExp(search, 'i')] } },
                        { tags: { $in: [new RegExp(search, 'i')] } }
                    ]
                }
            });
        }

        // Add organizer lookup
        pipeline.push(
            {
                $lookup: {
                    from: 'users',
                    localField: 'organizer',
                    foreignField: '_id',
                    as: 'organizerInfo'
                }
            },
            {
                $addFields: {
                    organizerName: {
                        $concat: [
                            { $arrayElemAt: ['$organizerInfo.firstName', 0] },
                            ' ',
                            { $arrayElemAt: ['$organizerInfo.lastName', 0] }
                        ]
                    }
                }
            },
            {
                $project: {
                    organizerInfo: 0
                }
            }
        );

        // Add pagination
        pipeline.push(...Database.buildPaginationPipeline(page, limit, sort, order));

        const [result] = await Event.aggregate(pipeline);

        const response: PaginatedResponse<any> = {
            data: result?.data || [],
            pagination: {
                page: result?.page || page,
                limit: result?.limit || limit,
                total: result?.total || 0,
                pages: result?.pages || 0,
                hasNext: (result?.page || page) < (result?.pages || 0),
                hasPrev: (result?.page || page) > 1
            }
        };

        res.json({
            success: true,
            data: response.data,
            pagination: response.pagination
        });
    });

    // Get single event by ID
    static getEventById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const event = await Event.findById(id).populate('organizer', 'firstName lastName email').lean();

        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions - only organizer, admin, or public events can be viewed
        const canView =
            req.user?.role === 'admin' ||
            event.organizer._id.toString() === req.user?._id.toString() ||
            (event.isPublic && event.status === 'published');

        if (!canView) {
            return next(new AppError('Not authorized to view this event', 403));
        }

        res.json({
            success: true,
            data: event
        });
    });

    // Create new event
    static createEvent = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const eventData = {
            ...req.body,
            organizer: req.user!._id
        };

        const event = await Event.create(eventData);
        await event.populate('organizer', 'firstName lastName email');

        logger.info('Event created successfully', {
            eventId: event._id,
            organizerId: req.user!._id,
            title: event.title
        });

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event
        });
    });

    // Update event
    static updateEvent = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const event = await Event.findById(id);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        if (!event.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to modify this event', 403));
        }

        // Don't allow changing organizer
        delete req.body.organizer;

        const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).populate(
            'organizer',
            'firstName lastName email'
        );

        logger.info('Event updated successfully', {
            eventId: event._id,
            organizerId: req.user!._id,
            title: updatedEvent!.title
        });

        res.json({
            success: true,
            message: 'Event updated successfully',
            data: updatedEvent
        });
    });

    // Delete event
    static deleteEvent = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const event = await Event.findById(id);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        if (!event.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to delete this event', 403));
        }

        // Use transaction to delete event and associated data
        await Database.withTransaction(async session => {
            // Delete all attendees for this event
            await Attendee.deleteMany({ event: id }).session(session);

            // Delete the event
            await Event.findByIdAndDelete(id).session(session);
        });

        logger.info('Event deleted successfully', {
            eventId: event._id,
            organizerId: req.user!._id,
            title: event.title
        });

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    });

    // Get event attendees
    static getEventAttendees = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const { page = 1, limit = 10, rsvpStatus, search } = req.query;

        const event = await Event.findById(id);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        const canView = req.user?.role === 'admin' || event.organizer.toString() === req.user?._id.toString();

        if (!canView) {
            return next(new AppError('Not authorized to view event attendees', 403));
        }

        // Build match criteria
        const matchCriteria: any = { event: id };

        if (rsvpStatus) {
            matchCriteria.rsvpStatus = rsvpStatus;
        }

        // Build aggregation pipeline
        const pipeline: any[] = [{ $match: matchCriteria }];

        // Add user lookup for registered attendees
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userInfo'
            }
        });

        // Add search functionality
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { 'userInfo.firstName': { $regex: search, $options: 'i' } },
                        { 'userInfo.lastName': { $regex: search, $options: 'i' } },
                        { 'userInfo.email': { $regex: search, $options: 'i' } },
                        { 'guestInfo.firstName': { $regex: search, $options: 'i' } },
                        { 'guestInfo.lastName': { $regex: search, $options: 'i' } },
                        { 'guestInfo.email': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Project fields
        pipeline.push({
            $project: {
                _id: 1,
                rsvpStatus: 1,
                checkedIn: 1,
                checkInTime: 1,
                dietaryRestrictions: 1,
                additionalNotes: 1,
                rsvpDate: 1,
                createdAt: 1,
                displayName: {
                    $cond: {
                        if: { $gt: [{ $size: '$userInfo' }, 0] },
                        then: {
                            $concat: [
                                { $arrayElemAt: ['$userInfo.firstName', 0] },
                                ' ',
                                { $arrayElemAt: ['$userInfo.lastName', 0] }
                            ]
                        },
                        else: {
                            $concat: ['$guestInfo.firstName', ' ', '$guestInfo.lastName']
                        }
                    }
                },
                email: {
                    $cond: {
                        if: { $gt: [{ $size: '$userInfo' }, 0] },
                        then: { $arrayElemAt: ['$userInfo.email', 0] },
                        else: '$guestInfo.email'
                    }
                },
                isGuest: {
                    $cond: {
                        if: { $gt: [{ $size: '$userInfo' }, 0] },
                        then: false,
                        else: true
                    }
                }
            }
        });

        // Add pagination
        pipeline.push(
            ...Database.buildPaginationPipeline(parseInt(page as string), parseInt(limit as string), 'rsvpDate', 'desc')
        );

        const [result] = await Attendee.aggregate(pipeline);

        const response: PaginatedResponse<any> = {
            data: result?.data || [],
            pagination: {
                page: result?.page || parseInt(page as string),
                limit: result?.limit || parseInt(limit as string),
                total: result?.total || 0,
                pages: result?.pages || 0,
                hasNext: (result?.page || parseInt(page as string)) < (result?.pages || 0),
                hasPrev: (result?.page || parseInt(page as string)) > 1
            }
        };

        res.json({
            success: true,
            data: response.data,
            pagination: response.pagination
        });
    });

    // Get event statistics
    static getEventStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const event = await Event.findById(id);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        const canView = req.user?.role === 'admin' || event.organizer.toString() === req.user?._id.toString();

        if (!canView) {
            return next(new AppError('Not authorized to view event statistics', 403));
        }

        const stats = await Attendee.aggregate([
            { $match: { event: event._id } },
            {
                $group: {
                    _id: '$rsvpStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        const checkedInCount = await Attendee.countDocuments({
            event: event._id,
            checkedIn: true
        });

        const totalInvited = await Attendee.countDocuments({ event: event._id });

        const formattedStats = {
            totalInvited,
            checkedIn: checkedInCount,
            rsvpBreakdown: stats.reduce(
                (acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                },
                {} as Record<string, number>
            ),
            attendanceRate: totalInvited > 0 ? ((checkedInCount / totalInvited) * 100).toFixed(1) : '0'
        };

        res.json({
            success: true,
            data: formattedStats
        });
    });

    // Duplicate event
    static duplicateEvent = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const originalEvent = await Event.findById(id);
        if (!originalEvent) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        if (!originalEvent.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to duplicate this event', 403));
        }

        // Create duplicate event
        const duplicateEventData = {
            ...originalEvent.toObject(),
            _id: undefined,
            title: `${originalEvent.title} (Copy)`,
            status: 'draft',
            attendeeCount: {
                attending: 0,
                notAttending: 0,
                maybe: 0,
                pending: 0,
                total: 0
            },
            publicRsvpToken: undefined,
            createdAt: undefined,
            updatedAt: undefined
        };

        const duplicatedEvent = await Event.create(duplicateEventData);
        await duplicatedEvent.populate('organizer', 'firstName lastName email');

        logger.info('Event duplicated successfully', {
            originalEventId: originalEvent._id,
            duplicatedEventId: duplicatedEvent._id,
            organizerId: req.user!._id
        });

        res.status(201).json({
            success: true,
            message: 'Event duplicated successfully',
            data: duplicatedEvent
        });
    });
}

export default EventController;
