import { Router } from 'express';
import DashboardController from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', authenticate, DashboardController.getDashboardStats);

/**
 * @route   GET /api/dashboard/events-over-time
 * @desc    Get event statistics over time
 * @access  Private
 */
router.get('/events-over-time', authenticate, DashboardController.getEventStatsOverTime);

/**
 * @route   GET /api/dashboard/rsvp-trends
 * @desc    Get RSVP trends over time
 * @access  Private
 */
router.get('/rsvp-trends', authenticate, DashboardController.getRSVPTrends);

/**
 * @route   GET /api/dashboard/upcoming-events
 * @desc    Get upcoming events summary
 * @access  Private
 */
router.get('/upcoming-events', authenticate, DashboardController.getUpcomingEventsSummary);

/**
 * @route   GET /api/dashboard/performance
 * @desc    Get performance metrics
 * @access  Private
 */
router.get('/performance', authenticate, DashboardController.getPerformanceMetrics);

export default router;
