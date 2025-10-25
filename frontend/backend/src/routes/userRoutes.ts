import { Router } from 'express';
import UserController from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateUser, validateQuery, validateObjectId } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (Admin only)
 */
router.get('/', authenticate, requireAdmin, validateQuery.pagination, UserController.getAllUsers);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, UserController.updateProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, validateUser.update, UserController.updateProfile);

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/statistics', authenticate, requireAdmin, UserController.getUserStatistics);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or user themselves)
 */
router.get('/:id', authenticate, validateObjectId, UserController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin or user themselves)
 */
router.put('/:id', authenticate, validateObjectId, validateUser.update, UserController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, validateObjectId, UserController.deleteUser);

/**
 * @route   POST /api/users/:id/reactivate
 * @desc    Reactivate user
 * @access  Private (Admin only)
 */
router.post('/:id/reactivate', authenticate, requireAdmin, validateObjectId, UserController.reactivateUser);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Change user password
 * @access  Private (Admin or user themselves)
 */
router.put('/:id/password', authenticate, validateObjectId, validateUser.changePassword, UserController.changePassword);

export default router;
