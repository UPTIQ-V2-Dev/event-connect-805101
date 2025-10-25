import { Router } from 'express';
import EventController from '../controllers/eventController';
import { authenticate, requireOrganizerOrAdmin } from '../middleware/auth';
import { validateEvent, validateQuery, validateObjectId } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/events
 * @desc    Get all events with filtering and pagination
 * @access  Private
 */
router.get('/', authenticate, validateQuery.eventFilters, EventController.getAllEvents);

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Private (Organizer or Admin)
 */
router.post('/', authenticate, requireOrganizerOrAdmin, validateEvent.create, EventController.createEvent);

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID
 * @access  Private
 */
router.get('/:id', authenticate, validateObjectId, EventController.getEventById);

/**
 * @route   PUT /api/events/:id
 * @desc    Update event
 * @access  Private (Event organizer or Admin)
 */
router.put('/:id', authenticate, validateObjectId, validateEvent.update, EventController.updateEvent);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private (Event organizer or Admin)
 */
router.delete('/:id', authenticate, validateObjectId, EventController.deleteEvent);

/**
 * @route   GET /api/events/:id/attendees
 * @desc    Get event attendees with filtering and pagination
 * @access  Private (Event organizer or Admin)
 */
router.get(
    '/:id/attendees',
    authenticate,
    validateObjectId,
    validateQuery.attendeeFilters,
    EventController.getEventAttendees
);

/**
 * @route   GET /api/events/:id/stats
 * @desc    Get event statistics
 * @access  Private (Event organizer or Admin)
 */
router.get('/:id/stats', authenticate, validateObjectId, EventController.getEventStats);

/**
 * @route   POST /api/events/:id/duplicate
 * @desc    Duplicate event
 * @access  Private (Event organizer or Admin)
 */
router.post('/:id/duplicate', authenticate, validateObjectId, EventController.duplicateEvent);

export default router;
