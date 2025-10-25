import { Router } from 'express';
import AttendeeController from '../controllers/attendeeController';
import { authenticate } from '../middleware/auth';
import { validateRSVP, validateObjectId } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/events/:id/rsvp
 * @desc    RSVP to an event (authenticated users)
 * @access  Private
 */
router.post('/:id/rsvp', authenticate, validateObjectId, validateRSVP.create, AttendeeController.rsvpToEvent);

/**
 * @route   GET /api/events/:id/rsvp
 * @desc    Get user's RSVP for an event
 * @access  Private
 */
router.get('/:id/rsvp', authenticate, validateObjectId, AttendeeController.getUserRSVP);

/**
 * @route   PUT /api/events/:id/attendees/:attendeeId/status
 * @desc    Update attendee status (RSVP status, check-in)
 * @access  Private (Event organizer or Admin)
 */
router.put(
    '/:id/attendees/:attendeeId/status',
    authenticate,
    validateObjectId,
    validateRSVP.update,
    AttendeeController.updateAttendeeStatus
);

/**
 * @route   DELETE /api/events/:id/attendees/:attendeeId
 * @desc    Remove attendee (cancel RSVP)
 * @access  Private (Event organizer, Admin, or attendee themselves)
 */
router.delete('/:id/attendees/:attendeeId', authenticate, validateObjectId, AttendeeController.removeAttendee);

/**
 * @route   PUT /api/events/:id/attendees/bulk
 * @desc    Bulk update attendees
 * @access  Private (Event organizer or Admin)
 */
router.put('/:id/attendees/bulk', authenticate, validateObjectId, AttendeeController.bulkUpdateAttendees);

/**
 * @route   GET /api/events/:id/attendees/export
 * @desc    Export attendees to CSV or JSON
 * @access  Private (Event organizer or Admin)
 */
router.get('/:id/attendees/export', authenticate, validateObjectId, AttendeeController.exportAttendees);

/**
 * @route   GET /api/events/:id/attendees/check-in-stats
 * @desc    Get check-in statistics
 * @access  Private (Event organizer or Admin)
 */
router.get('/:id/attendees/check-in-stats', authenticate, validateObjectId, AttendeeController.getCheckInStats);

export default router;
