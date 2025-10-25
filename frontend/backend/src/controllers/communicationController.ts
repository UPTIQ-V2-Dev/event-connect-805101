import { Request, Response, NextFunction } from 'express';
import { Event, Message, MessageTemplate, Attendee } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import emailService from '../utils/email';
import logger from '../utils/logger';

class CommunicationController {
    // Send message to event attendees
    static sendMessage = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id: eventId } = req.params;
        const { subject, content, messageType, recipients, scheduledFor, templateId } = req.body;

        const event = await Event.findById(eventId).populate('organizer', 'firstName lastName email');
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        if (!event.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to send messages for this event', 403));
        }

        // If using template, process it
        let processedSubject = subject;
        let processedContent = content;

        if (templateId) {
            const template = await MessageTemplate.findById(templateId);
            if (!template) {
                return next(new AppError('Template not found', 404));
            }

            // Process template with event variables
            const templateVars = {
                eventTitle: event.title,
                eventDate: event.startDate.toLocaleDateString(),
                eventTime: event.startDate.toLocaleTimeString(),
                eventLocation:
                    event.location.type === 'virtual'
                        ? event.location.virtualLink || 'Virtual Event'
                        : event.location.address || 'TBD',
                eventDescription: event.description,
                organizerName: `${event.organizer.firstName} ${event.organizer.lastName}`,
                rsvpLink: `${process.env.FRONTEND_URL}/rsvp/${event.publicRsvpToken}`
            };

            const processed = template.processTemplate(templateVars);
            processedSubject = processed.subject;
            processedContent = processed.content;
        }

        // Create message record
        const message = await Message.create({
            event: eventId,
            sender: req.user!._id,
            subject: processedSubject,
            content: processedContent,
            messageType,
            recipients,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
            template: templateId
        });

        // If not scheduled, send immediately
        if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
            await CommunicationController.processMessage(message._id.toString());
        }

        logger.info('Message created', {
            messageId: message._id,
            eventId,
            senderId: req.user!._id,
            messageType,
            isScheduled: !!scheduledFor
        });

        res.status(201).json({
            success: true,
            message: scheduledFor ? 'Message scheduled successfully' : 'Message sent successfully',
            data: message
        });
    });

    // Get messages for an event
    static getEventMessages = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id: eventId } = req.params;
        const { page = 1, limit = 10, messageType } = req.query;

        const event = await Event.findById(eventId);
        if (!event) {
            return next(new AppError('Event not found', 404));
        }

        // Check permissions
        if (!event.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to view messages for this event', 403));
        }

        // Build match criteria
        const matchCriteria: any = { event: eventId };
        if (messageType) {
            matchCriteria.messageType = messageType;
        }

        const messages = await Message.find(matchCriteria)
            .populate('sender', 'firstName lastName email')
            .populate('template', 'name templateType')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string))
            .skip((parseInt(page as string) - 1) * parseInt(limit as string));

        const totalMessages = await Message.countDocuments(matchCriteria);

        res.json({
            success: true,
            data: messages,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total: totalMessages,
                pages: Math.ceil(totalMessages / parseInt(limit as string))
            }
        });
    });

    // Get message templates
    static getMessageTemplates = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { templateType } = req.query;

        let query = MessageTemplate.find()
            .populate('createdBy', 'firstName lastName email')
            .sort({ isDefault: -1, createdAt: -1 });

        if (templateType) {
            query = query.where('templateType').equals(templateType);
        }

        const templates = await query.exec();

        res.json({
            success: true,
            data: templates
        });
    });

    // Create message template
    static createMessageTemplate = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const templateData = {
            ...req.body,
            createdBy: req.user!._id
        };

        const template = await MessageTemplate.create(templateData);
        await template.populate('createdBy', 'firstName lastName email');

        logger.info('Message template created', {
            templateId: template._id,
            createdBy: req.user!._id,
            templateType: template.templateType
        });

        res.status(201).json({
            success: true,
            message: 'Message template created successfully',
            data: template
        });
    });

    // Update message template
    static updateMessageTemplate = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const template = await MessageTemplate.findById(id);
        if (!template) {
            return next(new AppError('Template not found', 404));
        }

        // Check permissions
        if (!template.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to modify this template', 403));
        }

        const updatedTemplate = await MessageTemplate.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        }).populate('createdBy', 'firstName lastName email');

        logger.info('Message template updated', {
            templateId: template._id,
            updatedBy: req.user!._id
        });

        res.json({
            success: true,
            message: 'Template updated successfully',
            data: updatedTemplate
        });
    });

    // Delete message template
    static deleteMessageTemplate = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const template = await MessageTemplate.findById(id);
        if (!template) {
            return next(new AppError('Template not found', 404));
        }

        // Check permissions
        if (!template.canUserModify(req.user!._id.toString(), req.user!.role)) {
            return next(new AppError('Not authorized to delete this template', 403));
        }

        // Don't allow deletion of default templates
        if (template.isDefault) {
            return next(new AppError('Cannot delete default templates', 400));
        }

        await MessageTemplate.findByIdAndDelete(id);

        logger.info('Message template deleted', {
            templateId: template._id,
            deletedBy: req.user!._id
        });

        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    });

    // Process scheduled messages (internal method)
    static processMessage = async (messageId: string): Promise<void> => {
        try {
            const message = await Message.findById(messageId)
                .populate('event')
                .populate('sender', 'firstName lastName email');

            if (!message || !message.event) {
                logger.error('Message or event not found for processing', { messageId });
                return;
            }

            const event = message.event;

            // Get recipients based on criteria
            let attendees: any[] = [];

            switch (message.recipients.type) {
                case 'all':
                    attendees = await Attendee.find({ event: event._id }).populate('user', 'firstName lastName email');
                    break;

                case 'attending':
                case 'not-attending':
                case 'maybe':
                case 'pending':
                    attendees = await Attendee.find({
                        event: event._id,
                        rsvpStatus: message.recipients.type
                    }).populate('user', 'firstName lastName email');
                    break;

                case 'custom':
                    if (message.recipients.attendeeIds && message.recipients.attendeeIds.length > 0) {
                        attendees = await Attendee.find({
                            _id: { $in: message.recipients.attendeeIds },
                            event: event._id
                        }).populate('user', 'firstName lastName email');
                    }
                    break;

                default:
                    logger.error('Invalid recipient type', { messageId, recipientType: message.recipients.type });
                    return;
            }

            // Send emails to all recipients
            const emailPromises = attendees.map(async attendee => {
                const recipientEmail = attendee.user ? attendee.user.email : attendee.guestInfo?.email;
                const recipientName = attendee.user
                    ? `${attendee.user.firstName} ${attendee.user.lastName}`
                    : `${attendee.guestInfo?.firstName} ${attendee.guestInfo?.lastName}`;

                if (!recipientEmail) {
                    logger.warn('No email address for attendee', { attendeeId: attendee._id });
                    return { status: 'failed', reason: 'No email address' };
                }

                try {
                    // Replace recipient-specific variables in content
                    const personalizedContent = message.content
                        .replace(/{{recipientName}}/g, recipientName)
                        .replace(/{{recipientEmail}}/g, recipientEmail);

                    await emailService.sendEmail({
                        to: recipientEmail,
                        subject: message.subject,
                        html: personalizedContent
                    });

                    return { status: 'sent', email: recipientEmail };
                } catch (error) {
                    logger.error('Failed to send email to recipient', {
                        messageId,
                        recipientEmail,
                        error: error.message
                    });
                    return { status: 'failed', email: recipientEmail, reason: error.message };
                }
            });

            const results = await Promise.allSettled(emailPromises);

            // Update delivery status
            let sent = 0;
            let failed = 0;

            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    if (result.value.status === 'sent') {
                        sent++;
                    } else {
                        failed++;
                    }
                } else {
                    failed++;
                }
            });

            // Update message status
            message.status = 'sent';
            message.sentAt = new Date();
            message.deliveryStatus = {
                sent,
                delivered: sent, // Assume delivered if sent successfully
                failed,
                pending: 0
            };

            await message.save();

            logger.info('Message processing completed', {
                messageId,
                totalRecipients: attendees.length,
                sent,
                failed
            });
        } catch (error) {
            logger.error('Error processing message', { messageId, error: error.message });

            // Update message status to failed
            await Message.findByIdAndUpdate(messageId, { status: 'failed' });
        }
    };

    // Process scheduled messages (cron job endpoint)
    static processScheduledMessages = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const scheduledMessages = await Message.find({
            status: 'scheduled',
            scheduledFor: { $lte: new Date() }
        });

        const processPromises = scheduledMessages.map(message =>
            CommunicationController.processMessage(message._id.toString())
        );

        await Promise.all(processPromises);

        res.json({
            success: true,
            message: `Processed ${scheduledMessages.length} scheduled messages`,
            data: { processed: scheduledMessages.length }
        });
    });
}

export default CommunicationController;
