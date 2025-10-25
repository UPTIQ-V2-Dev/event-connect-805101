import { attendeeController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { attendeeValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// Public RSVP endpoint (no authentication required)
router.post('/rsvp', validate(attendeeValidation.createRsvp), attendeeController.createRsvp);

// Authenticated attendee management routes
router
    .route('/attendees')
    .get(auth('getAttendees'), validate(attendeeValidation.queryAttendees), attendeeController.getAttendees);

router
    .route('/attendees/:attendeeId')
    .get(validate(attendeeValidation.getAttendeeById), attendeeController.getAttendeeById)
    .delete(auth('manageAttendees'), validate(attendeeValidation.deleteAttendee), attendeeController.deleteAttendee);

// Event-specific attendee routes
router
    .route('/events/:eventId/attendees')
    .get(auth('getAttendees'), validate(attendeeValidation.getEventAttendees), attendeeController.getEventAttendees);

router
    .route('/events/:eventId/attendees/:attendeeId/status')
    .put(
        auth('manageAttendees'),
        validate(attendeeValidation.updateAttendeeStatus),
        attendeeController.updateAttendeeStatus
    );

export default router;

/**
 * @swagger
 * tags:
 *   name: Attendees
 *   description: Event attendee and RSVP management
 */

/**
 * @swagger
 * /rsvp:
 *   post:
 *     summary: Create RSVP for an event
 *     description: Public endpoint to create RSVP for an event. No authentication required.
 *     tags: [Attendees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - name
 *               - email
 *               - rsvpStatus
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: Event ID to RSVP for
 *               name:
 *                 type: string
 *                 description: Attendee name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Attendee email (must be unique per event)
 *               rsvpStatus:
 *                 type: string
 *                 enum: [attending, notAttending, maybe, pending]
 *                 description: RSVP status
 *               dietaryRequirements:
 *                 type: string
 *                 description: Optional dietary requirements
 *               guestInfo:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                     description: Contact phone number
 *                   company:
 *                     type: string
 *                     description: Company name
 *             example:
 *               eventId: "clp1a2b3c4d5e6f7g8h9i0"
 *               name: "John Doe"
 *               email: "john@example.com"
 *               rsvpStatus: "attending"
 *               dietaryRequirements: "Vegetarian"
 *               guestInfo:
 *                 phone: "+1-555-0123"
 *                 company: "TechCorp Inc."
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 eventId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 rsvpStatus:
 *                   type: string
 *                 dietaryRequirements:
 *                   type: string
 *                 registrationDate:
 *                   type: string
 *                   format: date-time
 *                 guestInfo:
 *                   type: object
 *                   properties:
 *                     phone:
 *                       type: string
 *                     company:
 *                       type: string
 *       "400":
 *         description: Bad Request - Invalid input or RSVP deadline passed
 *       "404":
 *         description: Event not found
 *       "409":
 *         description: RSVP already exists for this email and event
 *       "422":
 *         description: Event capacity reached
 */

/**
 * @swagger
 * /events/{eventId}/attendees:
 *   get:
 *     summary: Get attendees for a specific event
 *     description: Get list of all attendees for an event. Requires authentication.
 *     tags: [Attendees]
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
 *                   eventId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   rsvpStatus:
 *                     type: string
 *                   dietaryRequirements:
 *                     type: string
 *                   registrationDate:
 *                     type: string
 *                     format: date-time
 *                   guestInfo:
 *                     type: object
 *                     properties:
 *                       phone:
 *                         type: string
 *                       company:
 *                         type: string
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Event not found
 */

/**
 * @swagger
 * /events/{eventId}/attendees/{attendeeId}/status:
 *   put:
 *     summary: Update attendee RSVP status
 *     description: Update RSVP status of an attendee. Only event creators can perform this action.
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [attending, notAttending, maybe, pending]
 *                 description: New RSVP status
 *             example:
 *               status: "notAttending"
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 eventId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 rsvpStatus:
 *                   type: string
 *                 dietaryRequirements:
 *                   type: string
 *                 registrationDate:
 *                   type: string
 *                   format: date-time
 *                 guestInfo:
 *                   type: object
 *                   properties:
 *                     phone:
 *                       type: string
 *                     company:
 *                       type: string
 *       "400":
 *         description: Invalid status
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Only event creators can update attendee status
 *       "404":
 *         description: Attendee or event not found
 *       "422":
 *         description: Event capacity reached when changing to attending
 */

/**
 * @swagger
 * /attendees:
 *   get:
 *     summary: Get attendees with optional filtering
 *     description: Get attendees with optional filters and pagination. Requires authentication.
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Filter by event ID
 *       - in: query
 *         name: rsvpStatus
 *         schema:
 *           type: string
 *           enum: [attending, notAttending, maybe, pending]
 *         description: Filter by RSVP status
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Search by email (partial match)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of results
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         description: Unauthorized
 */

/**
 * @swagger
 * /attendees/{attendeeId}:
 *   get:
 *     summary: Get an attendee by ID
 *     description: Get a single attendee by their ID. No authentication required.
 *     tags: [Attendees]
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendee ID
 *     responses:
 *       "200":
 *         description: OK
 *       "404":
 *         description: Attendee not found
 *
 *   delete:
 *     summary: Delete an attendee
 *     description: Delete an attendee by their ID. Requires authentication and proper permissions.
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendee ID
 *     responses:
 *       "204":
 *         description: No Content
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Attendee not found
 */
