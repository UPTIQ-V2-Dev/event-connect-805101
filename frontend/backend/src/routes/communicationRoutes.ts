import { Router } from 'express';
import CommunicationController from '../controllers/communicationController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateMessage, validateMessageTemplate, validateObjectId } from '../middleware/validation';
import { messageLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   POST /api/events/:id/messages
 * @desc    Send message to event attendees
 * @access  Private (Event organizer or Admin)
 */
router.post(
    '/:id/messages',
    authenticate,
    validateObjectId,
    messageLimiter,
    validateMessage.send,
    CommunicationController.sendMessage
);

/**
 * @route   GET /api/events/:id/messages
 * @desc    Get messages for an event
 * @access  Private (Event organizer or Admin)
 */
router.get('/:id/messages', authenticate, validateObjectId, CommunicationController.getEventMessages);

/**
 * @route   GET /api/message-templates
 * @desc    Get message templates
 * @access  Private
 */
router.get('/message-templates', authenticate, CommunicationController.getMessageTemplates);

/**
 * @route   POST /api/message-templates
 * @desc    Create message template
 * @access  Private
 */
router.post(
    '/message-templates',
    authenticate,
    validateMessageTemplate.create,
    CommunicationController.createMessageTemplate
);

/**
 * @route   PUT /api/message-templates/:id
 * @desc    Update message template
 * @access  Private (Template creator or Admin)
 */
router.put(
    '/message-templates/:id',
    authenticate,
    validateObjectId,
    validateMessageTemplate.update,
    CommunicationController.updateMessageTemplate
);

/**
 * @route   DELETE /api/message-templates/:id
 * @desc    Delete message template
 * @access  Private (Template creator or Admin)
 */
router.delete('/message-templates/:id', authenticate, validateObjectId, CommunicationController.deleteMessageTemplate);

/**
 * @route   POST /api/messages/process-scheduled
 * @desc    Process scheduled messages (for cron job)
 * @access  Private (Admin only)
 */
router.post('/messages/process-scheduled', requireAdmin, CommunicationController.processScheduledMessages);

export default router;
