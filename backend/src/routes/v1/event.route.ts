import { eventController, messageController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { eventValidation, messageValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// Special route for recent events
router.route('/recent').get(auth('getEvents'), eventController.getRecentEvents);

// Main event routes
router
    .route('/')
    .post(auth('manageEvents'), validate(eventValidation.createEvent), eventController.createEvent)
    .get(auth('getEvents'), validate(eventValidation.getEvents), eventController.getEvents);

router
    .route('/:id')
    .get(auth('getEvents'), validate(eventValidation.getEventById), eventController.getEventById)
    .put(auth('manageEvents'), validate(eventValidation.updateEvent), eventController.updateEvent)
    .delete(auth('manageEvents'), validate(eventValidation.deleteEvent), eventController.deleteEvent);

// Event message routes
router
    .route('/:eventId/messages')
    .get(auth('getMessages'), validate(messageValidation.getEventMessages), messageController.getEventMessages)
    .post(auth('manageMessages'), validate(messageValidation.createMessage), messageController.createMessage);

export default router;

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management and retrieval
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Event ID
 *         title:
 *           type: string
 *           description: Event title
 *         description:
 *           type: string
 *           description: Event description
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Event start date and time
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Event end date and time
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [physical, virtual]
 *             address:
 *               type: string
 *               description: Physical address for physical events
 *             virtualLink:
 *               type: string
 *               description: Virtual meeting link for virtual events
 *         capacity:
 *           type: integer
 *           description: Maximum number of attendees
 *         rsvpDeadline:
 *           type: string
 *           format: date-time
 *           description: RSVP deadline
 *         status:
 *           type: string
 *           enum: [draft, published, cancelled]
 *         visibility:
 *           type: string
 *           enum: [public, private]
 *         createdBy:
 *           type: string
 *           description: ID of the user who created the event
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         attendeeCount:
 *           type: integer
 *           description: Total number of attendees
 *         rsvpStats:
 *           type: object
 *           properties:
 *             attending:
 *               type: integer
 *             notAttending:
 *               type: integer
 *             maybe:
 *               type: integer
 *             pending:
 *               type: integer
 *       example:
 *         id: "clx123456789"
 *         title: "Annual Company Conference 2025"
 *         description: "Join us for our biggest company conference"
 *         startDate: "2025-11-15T09:00:00Z"
 *         endDate: "2025-11-15T17:00:00Z"
 *         location:
 *           type: "physical"
 *           address: "123 Conference Center, Downtown City, NY 10001"
 *         capacity: 200
 *         rsvpDeadline: "2025-11-10T23:59:59Z"
 *         status: "published"
 *         visibility: "public"
 *         createdBy: "1"
 *         createdAt: "2025-10-01T10:00:00Z"
 *         updatedAt: "2025-10-20T14:30:00Z"
 *         attendeeCount: 85
 *         rsvpStats:
 *           attending: 75
 *           notAttending: 8
 *           maybe: 12
 *           pending: 25
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event. Only authenticated users can create events.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - startDate
 *               - location
 *               - visibility
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Event title
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 description: Event description
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event start date and time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event end date and time
 *               location:
 *                 type: object
 *                 required:
 *                   - type
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [physical, virtual]
 *                   address:
 *                     type: string
 *                     description: Required for physical events
 *                   virtualLink:
 *                     type: string
 *                     format: uri
 *                     description: Required for virtual events
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of attendees
 *               rsvpDeadline:
 *                 type: string
 *                 format: date-time
 *                 description: RSVP deadline
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *             example:
 *               title: "New Event"
 *               description: "Event description"
 *               startDate: "2025-12-01T10:00:00Z"
 *               location:
 *                 type: "physical"
 *                 address: "Event Hall"
 *               visibility: "public"
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 *
 *   get:
 *     summary: Get events
 *     description: Get paginated list of events with optional filtering. Users can only see their own events.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled]
 *         description: Filter by event status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, private]
 *         description: Filter by visibility
 *       - in: query
 *         name: dateStart
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events starting from this date
 *       - in: query
 *         name: dateEnd
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events ending before this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /events/recent:
 *   get:
 *     summary: Get recent events
 *     description: Get recent events for dashboard display. Users can only see their own events.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   attendeeCount:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   rsvpStats:
 *                     type: object
 *                     properties:
 *                       attending:
 *                         type: integer
 *                       notAttending:
 *                         type: integer
 *                       maybe:
 *                         type: integer
 *                       pending:
 *                         type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get a specific event
 *     description: Get a specific event by ID. Users can only access their own events.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 *
 *   put:
 *     summary: Update an event
 *     description: Update an existing event. Users can only update their own events.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 minLength: 1
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [physical, virtual]
 *                   address:
 *                     type: string
 *                   virtualLink:
 *                     type: string
 *                     format: uri
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *               rsvpDeadline:
 *                 type: string
 *                 format: date-time
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *               status:
 *                 type: string
 *                 enum: [draft, published, cancelled]
 *             example:
 *               title: "Updated Event Title"
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 *
 *   delete:
 *     summary: Delete an event
 *     description: Delete an event. Users can only delete their own events.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /events/{eventId}/messages:
 *   get:
 *     summary: Get messages for a specific event
 *     description: Get all messages sent for a specific event. Only event creators can view their event messages.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       "200":
 *         description: List of event messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   eventId:
 *                     type: string
 *                   subject:
 *                     type: string
 *                   content:
 *                     type: string
 *                   recipientCount:
 *                     type: integer
 *                   deliveryStatus:
 *                     type: string
 *                     enum: [draft, scheduled, sent, delivered, failed, pending]
 *                   scheduledDate:
 *                     type: string
 *                     format: date-time
 *                   sentDate:
 *                     type: string
 *                     format: date-time
 *                   createdBy:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   recipientFilter:
 *                     type: object
 *                     properties:
 *                       rsvpStatus:
 *                         type: array
 *                         items:
 *                           type: string
 *                       registrationDateRange:
 *                         type: object
 *                         properties:
 *                           start:
 *                             type: string
 *                             format: date-time
 *                           end:
 *                             type: string
 *                             format: date-time
 *                       searchQuery:
 *                         type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   post:
 *     summary: Create and send a message to event attendees
 *     description: Create and send a message to event attendees based on recipient filters. Only event creators can send messages to their events.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - content
 *               - recipientFilter
 *             properties:
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
 *                 description: Optional date to schedule the message for future sending
 *             example:
 *               subject: "Event Reminder"
 *               content: "Don't forget about the event tomorrow!"
 *               recipientFilter:
 *                 rsvpStatus: ["attending", "maybe"]
 *     responses:
 *       "201":
 *         description: Message created and sent successfully
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
 *                 scheduledDate:
 *                   type: string
 *                   format: date-time
 *                 sentDate:
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
 */
