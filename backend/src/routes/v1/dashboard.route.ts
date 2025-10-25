import { dashboardController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { dashboardValidation } from '../../validations/index.ts';
import express from 'express';

const router = express.Router();

// GET /dashboard/stats - Get dashboard statistics (authenticated users only)
router.route('/stats').get(auth('getDashboard'), validate(dashboardValidation.getStats), dashboardController.getStats);

export default router;

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics and metrics
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics and metrics
 *     description: Get dashboard statistics including total events, active events, total attendees, upcoming events, and recent activity for the authenticated user.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *                   description: Total number of events created by the user
 *                   example: 12
 *                 activeEvents:
 *                   type: integer
 *                   description: Number of events with status "published" or "active"
 *                   example: 8
 *                 totalAttendees:
 *                   type: integer
 *                   description: Total number of attendees across user's events
 *                   example: 450
 *                 upcomingEvents:
 *                   type: integer
 *                   description: Number of events with startDate in the future
 *                   example: 5
 *                 recentActivity:
 *                   type: object
 *                   description: Recent activity in the last 30 days
 *                   properties:
 *                     newRSVPs:
 *                       type: integer
 *                       description: Number of new RSVPs in the last 30 days
 *                       example: 23
 *                     messagesSent:
 *                       type: integer
 *                       description: Number of messages sent in the last 30 days
 *                       example: 45
 *                     eventsCreated:
 *                       type: integer
 *                       description: Number of events created in the last 30 days
 *                       example: 3
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */
