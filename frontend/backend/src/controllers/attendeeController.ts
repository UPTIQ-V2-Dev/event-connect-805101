import { Request, Response, NextFunction } from 'express';
import { Event, Attendee, User } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import emailService from '../utils/email';
import logger from '../utils/logger';
import Database from '../utils/database';

class AttendeeController {
    // RSVP to an event (for authenticated users)
    static rsvpToEvent = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id: eventId } = req.params;
        const { rsvpStatus, dietaryRestrictions, additionalNotes } = req.body;

        const event = await Event.findById(eventId).populate('organizer', 'firstName lastName email');
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check if RSVP is open
        if (!event.isRSVPOpen()) {
            return next(new AppError('RSVP is closed for this event', 400));
        }

        // Check capacity if user is RSVPing as attending
        if (rsvpStatus === 'attending' && event.capacity) {
            const currentAttending = event.attendeeCount.attending;
            if (currentAttending >= event.capacity) {
                return next(new AppError('Event is at full capacity', 400));
            }
        }

        // Check if user already has an RSVP for this event
        let existingRSVP = await Attendee.findOne({
            event: eventId,
            user: req.user!._id
        });

        if (existingRSVP) {
            // Update existing RSVP
            existingRSVP.rsvpStatus = rsvpStatus;
            existingRSVP.dietaryRestrictions = dietaryRestrictions;
            existingRSVP.additionalNotes = additionalNotes;
            existingRSVP.rsvpDate = new Date();

            await existingRSVP.save();

            logger.info('RSVP updated', {
                attendeeId: existingRSVP._id,
                eventId,
                userId: req.user!._id,
                rsvpStatus
            });

            // Send confirmation email
            try {
                await emailService.sendRSVPConfirmation(
                    req.user!.email,
                    `${req.user!.firstName} ${req.user!.lastName}`,
                    event.title,
                    rsvpStatus,
                    {
                        date: event.startDate.toLocaleDateString(),
                        time: event.startDate.toLocaleTimeString(),
                        location:
                            event.location.type === 'virtual'
                                ? event.location.virtualLink || 'Virtual Event'
                                : event.location.address || 'TBD'
                    },
                    `${process.env.FRONTEND_URL}/rsvp/${event.publicRsvpToken}`,
                    `${event.organizer.firstName} ${event.organizer.lastName}`
                );
            } catch (error) {
                logger.error('Failed to send RSVP confirmation email', {
                    error: error.message,
                    attendeeId: existingRSVP._id
                });
            }

            return res.json({
                success: true,
                message: 'RSVP updated successfully',
                data: existingRSVP
            });
        }

        // Create new RSVP
        const newRSVP = await Attendee.create({
            event: eventId,
            user: req.user!._id,
            rsvpStatus,
            dietaryRestrictions,
            additionalNotes,
            rsvpDate: new Date()
        });

        logger.info('New RSVP created', {
            attendeeId: newRSVP._id,
            eventId,
            userId: req.user!._id,
            rsvpStatus
        });

        // Send confirmation email
        try {
            await emailService.sendRSVPConfirmation(
                req.user!.email,
                `${req.user!.firstName} ${req.user!.lastName}`,
                event.title,
                rsvpStatus,
                {
                    date: event.startDate.toLocaleDateString(),
                    time: event.startDate.toLocaleTimeString(),
                    location:
                        event.location.type === 'virtual'
                            ? event.location.virtualLink || 'Virtual Event'
                            : event.location.address || 'TBD'
                },
                `${process.env.FRONTEND_URL}/rsvp/${event.publicRsvpToken}`,
                `${event.organizer.firstName} ${event.organizer.lastName}`
            );
        } catch (error) {
            logger.error('Failed to send RSVP confirmation email', {
                error: error.message,
                attendeeId: newRSVP._id
            });
        }

        res.status(201).json({
            success: true,
            message: 'RSVP submitted successfully',
            data: newRSVP
        });
    });

    // Update attendee status (for event organizers)
    static updateAttendeeStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id: eventId, attendeeId } = req.params;
        const { rsvpStatus, checkedIn } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        if (!event.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to modify attendee status', 403));
        }

        const attendee = await Attendee.findOne({ _id: attendeeId, event: eventId }).populate(
            'user',
            'firstName lastName email'
        );

        if (!attendee) {
            return next(new AppError('Attendee not found', 404));
        }

        // Update attendee
        if (rsvpStatus !== undefined) {
            attendee.rsvpStatus = rsvpStatus;
        }

        if (checkedIn !== undefined) {
            attendee.checkedIn = checkedIn;
            if (checkedIn) {
                attendee.checkInTime = new Date();
            } else {
                attendee.checkInTime = undefined;
            }
        }

        await attendee.save();

        logger.info('Attendee status updated', {
            attendeeId,
            eventId,
            organizerId: req.user!._id,
            rsvpStatus,
            checkedIn
        });

        res.json({
            success: true,
            message: 'Attendee status updated successfully',
            data: attendee
        });
    });

    // Get user's RSVP for an event
    static getUserRSVP = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id: eventId } = req.params;

        const rsvp = await Attendee.findOne({
            event: eventId,
            user: req.user!._id
        });

        if (!rsvp) {
            return res.json({
                success: true,
                data: null,
                message: 'No RSVP found for this event'
            });
        }

        res.json({
            success: true,
            data: rsvp
        });
    });

    // Remove attendee (cancel RSVP)
    static removeAttendee = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id: eventId, attendeeId } = req.params;

        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        const attendee = await Attendee.findOne({ _id: attendeeId, event: eventId });
        if (!attendee) {
            return next(new AppError('Attendee not found', 404));
        }

        // Check permissions - organizer, admin, or the attendee themselves
        const canRemove =
            req.user?.role === 'admin' ||
            event.organizer.toString() === req.user?._id.toString() ||
            (attendee.user && attendee.user.toString() === req.user?._id.toString());

        if (!canRemove) {
            return next(new AppError('Not authorized to remove this attendee', 403));
        }

        await Attendee.findByIdAndDelete(attendeeId);

        logger.info('Attendee removed', {
            attendeeId,
            eventId,
            removedBy: req.user!._id
        });

        res.json({
            success: true,
            message: 'Attendee removed successfully'
        });
    });

    // Bulk update attendees
    static bulkUpdateAttendees = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id: eventId } = req.params;
        const { attendeeIds, action, data } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        if (!event.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to modify attendees', 403));
        }

        if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
            return next(new AppError('Attendee IDs are required', 400));
        }

        let updateData: any = {};
        let message = '';

        switch (action) {
            case 'updateRSVPStatus':
                if (!data.rsvpStatus) {
                    return next(new AppError('RSVP status is required', 400));
                }
                updateData.rsvpStatus = data.rsvpStatus;
                message = `Updated RSVP status for ${attendeeIds.length} attendees`;
                break;

            case 'checkIn':
                updateData.checkedIn = true;
                updateData.checkInTime = new Date();
                message = `Checked in ${attendeeIds.length} attendees`;
                break;

            case 'checkOut':
                updateData.checkedIn = false;
                updateData.checkInTime = undefined;
                message = `Checked out ${attendeeIds.length} attendees`;
                break;

            default:
                return next(new AppError('Invalid action', 400));
        }

        const result = await Attendee.updateMany(
            {
                _id: { $in: attendeeIds },
                event: eventId
            },
            updateData
        );

        // Trigger attendee count update
        await event.updateAttendeeCount();

        logger.info('Bulk attendee update', {
            eventId,
            action,
            count: result.modifiedCount,
            organizerId: req.user!._id
        });

        res.json({
            success: true,
            message,
            data: {
                modified: result.modifiedCount
            }
        });
    });

    // Export attendees to CSV
    static exportAttendees = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id: eventId } = req.params;
        const { format = 'csv', rsvpStatus } = req.query;

        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        if (!event.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to export attendees', 403));
        }

        // Build match criteria
        const matchCriteria: any = { event: eventId };
        if (rsvpStatus) {
            matchCriteria.rsvpStatus = rsvpStatus;
        }

        const attendees = await Attendee.aggregate([
            { $match: matchCriteria },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $project: {
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
                    phone: {
                        $cond: {
                            if: { $gt: [{ $size: '$userInfo' }, 0] },
                            then: null,
                            else: '$guestInfo.phone'
                        }
                    },
                    rsvpStatus: 1,
                    checkedIn: 1,
                    checkInTime: 1,
                    dietaryRestrictions: 1,
                    additionalNotes: 1,
                    rsvpDate: 1,
                    isGuest: {
                        $cond: {
                            if: { $gt: [{ $size: '$userInfo' }, 0] },
                            then: false,
                            else: true
                        }
                    }
                }
            },
            { $sort: { rsvpDate: -1 } }
        ]);

        if (format === 'csv') {
            // Generate CSV
            const csvHeader =
                'Name,Email,Phone,RSVP Status,Checked In,Check In Time,Dietary Restrictions,Additional Notes,RSVP Date,Guest\n';
            const csvRows = attendees
                .map(attendee => {
                    const phone = attendee.phone || '';
                    const checkInTime = attendee.checkInTime ? new Date(attendee.checkInTime).toLocaleString() : '';
                    const rsvpDate = new Date(attendee.rsvpDate).toLocaleString();
                    const dietaryRestrictions = (attendee.dietaryRestrictions || '').replace(/[",\n\r]/g, ' ');
                    const additionalNotes = (attendee.additionalNotes || '').replace(/[",\n\r]/g, ' ');

                    return `"${attendee.displayName}","${attendee.email}","${phone}","${attendee.rsvpStatus}","${attendee.checkedIn}","${checkInTime}","${dietaryRestrictions}","${additionalNotes}","${rsvpDate}","${attendee.isGuest}"`;
                })
                .join('\n');

            const csvContent = csvHeader + csvRows;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="event-${eventId}-attendees.csv"`);
            res.send(csvContent);
        } else {
            // Return JSON format
            res.json({
                success: true,
                data: attendees
            });
        }

        logger.info('Attendees exported', {
            eventId,
            format,
            count: attendees.length,
            organizerId: req.user!._id
        });
    });

    // Get attendee check-in statistics
    static getCheckInStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id: eventId } = req.params;

        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        if (!event.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to view check-in statistics', 403));
        }

        const stats = await Attendee.aggregate([
            { $match: { event: event._id } },
            {
                $group: {
                    _id: null,
                    totalAttendees: { $sum: 1 },
                    checkedIn: { $sum: { $cond: ['$checkedIn', 1, 0] } },
                    attending: { $sum: { $cond: [{ $eq: ['$rsvpStatus', 'attending'] }, 1, 0] } },
                    notAttending: { $sum: { $cond: [{ $eq: ['$rsvpStatus', 'not-attending'] }, 1, 0] } },
                    maybe: { $sum: { $cond: [{ $eq: ['$rsvpStatus', 'maybe'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$rsvpStatus', 'pending'] }, 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || {
            totalAttendees: 0,
            checkedIn: 0,
            attending: 0,
            notAttending: 0,
            maybe: 0,
            pending: 0
        };

        // Calculate check-in rate
        const checkInRate = result.attending > 0 ? ((result.checkedIn / result.attending) * 100).toFixed(1) : '0';

        res.json({
            success: true,
            data: {
                ...result,
                checkInRate: parseFloat(checkInRate)
            }
        });
    });
}

export default AttendeeController;
