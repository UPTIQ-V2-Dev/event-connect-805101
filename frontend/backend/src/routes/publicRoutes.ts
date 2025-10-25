import { Router } from 'express';
import PublicController from '../controllers/publicController';
import { validateRSVP } from '../middleware/validation';
import { rsvpLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   GET /api/public/events/:token
 * @desc    Get public event details by token
 * @access  Public
 */
router.get('/events/:token', PublicController.getPublicEvent);

/**
 * @route   POST /api/public/events/:token/rsvp
 * @desc    Submit public RSVP (for guests)
 * @access  Public
 */
router.post('/events/:token/rsvp', rsvpLimiter, validateRSVP.create, PublicController.submitPublicRSVP);

/**
 * @route   GET /api/public/events/:token/rsvp/:rsvpToken
 * @desc    Get public RSVP by token (for editing)
 * @access  Public
 */
router.get('/events/:token/rsvp/:rsvpToken', PublicController.getPublicRSVP);

/**
 * @route   PUT /api/public/events/:token/rsvp/:rsvpToken
 * @desc    Update public RSVP by token
 * @access  Public
 */
router.put('/events/:token/rsvp/:rsvpToken', rsvpLimiter, validateRSVP.update, PublicController.updatePublicRSVP);

/**
 * @route   GET /api/public/events/:token/attendee-count
 * @desc    Get event attendee count (public)
 * @access  Public
 */
router.get('/events/:token/attendee-count', PublicController.getEventAttendeeCount);

export default router;
