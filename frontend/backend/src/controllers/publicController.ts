import { Request, Response, NextFunction } from 'express';
import { Event, Attendee } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import emailService from '../utils/email';
import logger from '../utils/logger';

class PublicController {
    // Get public event details by token
    static getPublicEvent = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { token } = req.params;

        const event = await Event.findOne({
            publicRsvpToken: token,
            isPublic: true,
            status: 'published'
        })
            .populate('organizer', 'firstName lastName email')
            .lean();

        if (!event) {
            return next(new AppError('Event not found or not available for public RSVP', 404));
        }

        // Don't expose sensitive information
        const publicEventData = {
            _id: event._id,
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            timezone: event.timezone,
            location: event.location,
            capacity: event.capacity,
            rsvpDeadline: event.rsvpDeadline,
            categories: event.categories,
            tags: event.tags,
            attendeeCount: event.attendeeCount,
            organizerName: `${event.organizer.firstName} ${event.organizer.lastName}`,
            isRSVPOpen: event.startDate > new Date() && (!event.rsvpDeadline || event.rsvpDeadline > new Date())
        };

        res.json({
            success: true,
            data: publicEventData
        });
    });

    // Submit public RSVP (for guests)
    static submitPublicRSVP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { token } = req.params;
        const { rsvpStatus, guestInfo, dietaryRestrictions, additionalNotes } = req.body;

        const event = await Event.findOne({
            publicRsvpToken: token,
            isPublic: true,
            status: 'published'
        }).populate('organizer', 'firstName lastName email');

        if (!event) {
            return next(new AppError('Event not found or not available for public RSVP', 404));
        }

        // Check if RSVP is open
        if (!event.isRSVPOpen()) {
            return next(new AppError('RSVP is closed for this event', 400));
        }

        // Validate guest info
        if (!guestInfo || !guestInfo.firstName || !guestInfo.lastName || !guestInfo.email) {
            return next(new AppError('Guest information is required', 400));
        }

        // Check capacity if guest is RSVPing as attending
        if (rsvpStatus === 'attending' && event.capacity) {
            const currentAttending = event.attendeeCount.attending;
            if (currentAttending >= event.capacity) {
                return next(new AppError('Event is at full capacity', 400));
            }
        }

        // Check if guest already has an RSVP for this event
        let existingRSVP = await Attendee.findOne({
            'event': event._id,
            'guestInfo.email': guestInfo.email.toLowerCase()
        });

        if (existingRSVP) {
            // Update existing RSVP
            existingRSVP.rsvpStatus = rsvpStatus;
            existingRSVP.guestInfo = {
                firstName: guestInfo.firstName.trim(),
                lastName: guestInfo.lastName.trim(),
                email: guestInfo.email.toLowerCase().trim(),
                phone: guestInfo.phone?.trim()
            };
            existingRSVP.dietaryRestrictions = dietaryRestrictions;
            existingRSVP.additionalNotes = additionalNotes;
            existingRSVP.rsvpDate = new Date();

            await existingRSVP.save();

            logger.info('Public RSVP updated', {
                attendeeId: existingRSVP._id,
                eventId: event._id,
                guestEmail: guestInfo.email,
                rsvpStatus
            });

            // Send confirmation email
            try {
                await emailService.sendRSVPConfirmation(
                    guestInfo.email,
                    `${guestInfo.firstName} ${guestInfo.lastName}`,
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
                data: {
                    rsvpId: existingRSVP._id,
                    rsvpStatus: existingRSVP.rsvpStatus
                }
            });
        }

        // Create new RSVP
        const newRSVP = await Attendee.create({
            event: event._id,
            guestInfo: {
                firstName: guestInfo.firstName.trim(),
                lastName: guestInfo.lastName.trim(),
                email: guestInfo.email.toLowerCase().trim(),
                phone: guestInfo.phone?.trim()
            },
            rsvpStatus,
            dietaryRestrictions,
            additionalNotes,
            rsvpDate: new Date()
        });

        logger.info('New public RSVP created', {
            attendeeId: newRSVP._id,
            eventId: event._id,
            guestEmail: guestInfo.email,
            rsvpStatus
        });

        // Send confirmation email
        try {
            await emailService.sendRSVPConfirmation(
                guestInfo.email,
                `${guestInfo.firstName} ${guestInfo.lastName}`,
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
            data: {
                rsvpId: newRSVP._id,
                rsvpStatus: newRSVP.rsvpStatus
            }
        });
    });

    // Get public RSVP by token (for editing existing RSVP)
    static getPublicRSVP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { token, rsvpToken } = req.params;

        const attendee = await Attendee.findOne({
            rsvpToken: rsvpToken
        }).populate({
            path: 'event',
            match: {
                publicRsvpToken: token,
                isPublic: true,
                status: 'published'
            },
            populate: {
                path: 'organizer',
                select: 'firstName lastName email'
            }
        });

        if (!attendee || !attendee.event) {
            return next(new AppError('RSVP not found', 404));
        }

        // Return attendee information for editing
        const rsvpData = {
            _id: attendee._id,
            rsvpStatus: attendee.rsvpStatus,
            guestInfo: attendee.guestInfo,
            dietaryRestrictions: attendee.dietaryRestrictions,
            additionalNotes: attendee.additionalNotes,
            rsvpDate: attendee.rsvpDate,
            event: {
                _id: attendee.event._id,
                title: attendee.event.title,
                startDate: attendee.event.startDate,
                endDate: attendee.event.endDate,
                location: attendee.event.location
            }
        };

        res.json({
            success: true,
            data: rsvpData
        });
    });

    // Update public RSVP by token
    static updatePublicRSVP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { token, rsvpToken } = req.params;
        const { rsvpStatus, guestInfo, dietaryRestrictions, additionalNotes } = req.body;

        const attendee = await Attendee.findOne({
            rsvpToken: rsvpToken
        }).populate({
            path: 'event',
            match: {
                publicRsvpToken: token,
                isPublic: true,
                status: 'published'
            },
            populate: {
                path: 'organizer',
                select: 'firstName lastName email'
            }
        });

        if (!attendee || !attendee.event) {
            return next(new AppError('RSVP not found', 404));
        }

        const event = attendee.event;

        // Check if RSVP is still open
        if (!event.isRSVPOpen()) {
            return next(new AppError('RSVP is closed for this event', 400));
        }

        // Check capacity if updating to attending
        if (rsvpStatus === 'attending' && attendee.rsvpStatus !== 'attending' && event.capacity) {
            const currentAttending = event.attendeeCount.attending;
            if (currentAttending >= event.capacity) {
                return next(new AppError('Event is at full capacity', 400));
            }
        }

        // Update attendee information
        attendee.rsvpStatus = rsvpStatus;
        if (guestInfo) {
            attendee.guestInfo = {
                firstName: guestInfo.firstName.trim(),
                lastName: guestInfo.lastName.trim(),
                email: guestInfo.email.toLowerCase().trim(),
                phone: guestInfo.phone?.trim()
            };
        }
        attendee.dietaryRestrictions = dietaryRestrictions;
        attendee.additionalNotes = additionalNotes;
        attendee.rsvpDate = new Date();

        await attendee.save();

        logger.info('Public RSVP updated via token', {
            attendeeId: attendee._id,
            eventId: event._id,
            rsvpStatus
        });

        // Send confirmation email
        try {
            const guestName = attendee.guestInfo
                ? `${attendee.guestInfo.firstName} ${attendee.guestInfo.lastName}`
                : 'Guest';
            const guestEmail = attendee.guestInfo?.email || '';

            if (guestEmail) {
                await emailService.sendRSVPConfirmation(
                    guestEmail,
                    guestName,
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
            }
        } catch (error) {
            logger.error('Failed to send RSVP confirmation email', {
                error: error.message,
                attendeeId: attendee._id
            });
        }

        res.json({
            success: true,
            message: 'RSVP updated successfully',
            data: {
                rsvpId: attendee._id,
                rsvpStatus: attendee.rsvpStatus
            }
        });
    });

    // Get event attendee count (public)
    static getEventAttendeeCount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { token } = req.params;

        const event = await Event.findOne({
            publicRsvpToken: token,
            isPublic: true,
            status: 'published'
        }).select('attendeeCount capacity');

        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        res.json({
            success: true,
            data: {
                attendeeCount: event.attendeeCount,
                capacity: event.capacity,
                spotsRemaining: event.capacity ? Math.max(0, event.capacity - event.attendeeCount.attending) : null
            }
        });
    });
}

export default PublicController;
