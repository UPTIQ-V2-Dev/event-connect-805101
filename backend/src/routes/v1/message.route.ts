import { messageController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { messageValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// Message routes
router
    .route('/schedule')
    .post(auth('manageMessages'), validate(messageValidation.scheduleMessage), messageController.scheduleMessage);

router
    .route('/:messageId/delivery-status')
    .get(auth('getMessages'), validate(messageValidation.getDeliveryStatus), messageController.getDeliveryStatus);

export default router;

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management and delivery
 */

/**
 * @swagger
 * /messages/schedule:
 *   post:
 *     summary: Schedule a message to be sent later
 *     description: Schedule a message to event attendees for future delivery. Only event creators can schedule messages for their events.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - subject
 *               - content
 *               - recipientFilter
 *               - scheduledDate
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: The ID of the event
 *               subject:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Message subject
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 description: Message content
 *               recipientFilter:
 *                 type: object
 *                 properties:
 *                   rsvpStatus:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [attending, notAttending, maybe, pending]
 *                   registrationDateRange:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date-time
 *                       end:
 *                         type: string
 *                         format: date-time
 *                   searchQuery:
 *                     type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *                 description: When to send the message (must be in the future)
 *             example:
 *               eventId: "event-123"
 *               subject: "Event Reminder"
 *               content: "Don't forget about the event tomorrow!"
 *               recipientFilter:
 *                 rsvpStatus: ["attending", "maybe"]
 *               scheduledDate: "2025-11-15T08:00:00Z"
 *     responses:
 *       "201":
 *         description: Message scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 eventId:
 *                   type: string
 *                 subject:
 *                   type: string
 *                 content:
 *                   type: string
 *                 recipientCount:
 *                   type: integer
 *                 deliveryStatus:
 *                   type: string
 *                   enum: [scheduled, sent, delivered, failed, pending]
 *                 scheduledDate:
 *                   type: string
 *                   format: date-time
 *                 createdBy:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 recipientFilter:
 *                   type: object
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "422":
 *         description: Scheduled date must be in the future
 */

/**
 * @swagger
 * /messages/{messageId}/delivery-status:
 *   get:
 *     summary: Get delivery status details for a message
 *     description: Get detailed delivery status information for a specific message. Only event creators can view delivery status.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       "200":
 *         description: Delivery status details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messageId:
 *                   type: string
 *                 totalRecipients:
 *                   type: integer
 *                 delivered:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 pending:
 *                   type: integer
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       recipientEmail:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [delivered, failed, pending]
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       error:
 *                         type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
