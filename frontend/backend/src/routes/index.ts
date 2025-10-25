import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import eventRoutes from './eventRoutes';
import attendeeRoutes from './attendeeRoutes';
import dashboardRoutes from './dashboardRoutes';
import communicationRoutes from './communicationRoutes';
import publicRoutes from './publicRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Event RSVP Manager API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/events', attendeeRoutes); // Nested under events
router.use('/dashboard', dashboardRoutes);
router.use('/', communicationRoutes); // Communication routes include both events/:id/messages and message-templates
router.use('/public', publicRoutes);

export default router;
