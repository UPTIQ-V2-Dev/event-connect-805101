import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import Database from '../utils/database';
import logger from '../utils/logger';

class UserController {
    // Get all users (admin only)
    static getAllUsers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { page = 1, limit = 10, role, search, isActive } = req.query;

        // Build match criteria
        const matchCriteria: any = {};

        if (role) {
            matchCriteria.role = role;
        }

        if (isActive !== undefined) {
            matchCriteria.isActive = isActive === 'true';
        }

        // Build aggregation pipeline
        const pipeline: any[] = [{ $match: matchCriteria }];

        // Add search functionality
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { firstName: { $regex: search, $options: 'i' } },
                        { lastName: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Project fields (exclude sensitive information)
        pipeline.push({
            $project: {
                _id: 1,
                email: 1,
                firstName: 1,
                lastName: 1,
                role: 1,
                isEmailVerified: 1,
                isActive: 1,
                lastLogin: 1,
                createdAt: 1,
                updatedAt: 1
            }
        });

        // Add pagination
        pipeline.push(
            ...Database.buildPaginationPipeline(
                parseInt(page as string),
                parseInt(limit as string),
                'createdAt',
                'desc'
            )
        );

        const [result] = await User.aggregate(pipeline);

        const response = {
            data: result?.data || [],
            pagination: {
                page: result?.page || parseInt(page as string),
                limit: result?.limit || parseInt(limit as string),
                total: result?.total || 0,
                pages: result?.pages || 0,
                hasNext: (result?.page || parseInt(page as string)) < (result?.pages || 0),
                hasPrev: (result?.page || parseInt(page as string)) > 1
            }
        };

        res.json({
            success: true,
            data: response.data,
            pagination: response.pagination
        });
    });

    // Get user by ID
    static getUserById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        // Check permissions - admin or the user themselves
        if (req.user?.role !== 'admin' && req.user?._id.toString() !== id) {
            return next(new AppError('Not authorized to view this user', 403));
        }

        const user = await User.findById(id).select('-password -refreshTokens');
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        res.json({
            success: true,
            data: user
        });
    });

    // Update user
    static updateUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const { firstName, lastName, email, role } = req.body;

        // Check permissions - admin or the user themselves
        const isOwnProfile = req.user?._id.toString() === id;
        const isAdmin = req.user?.role === 'admin';

        if (!isAdmin && !isOwnProfile) {
            return next(new AppError('Not authorized to update this user', 403));
        }

        // Only admin can change roles
        if (role && !isAdmin) {
            return next(new AppError('Only administrators can change user roles', 403));
        }

        // Prevent users from changing their own role to admin
        if (isOwnProfile && role && role !== req.user?.role) {
            return next(new AppError('You cannot change your own role', 403));
        }

        const user = await User.findById(id);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({
                email: email.toLowerCase(),
                _id: { $ne: id }
            });

            if (existingUser) {
                return next(new AppError('Email address is already in use', 400));
            }

            // If email is changed, set email verification to false
            user.isEmailVerified = false;
        }

        // Update user fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email.toLowerCase();
        if (role && isAdmin) user.role = role;

        await user.save();

        logger.info('User updated', {
            userId: user._id,
            updatedBy: req.user!._id,
            fieldsUpdated: Object.keys(req.body)
        });

        // Return user without sensitive data
        const updatedUser = await User.findById(id).select('-password -refreshTokens');

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    });

    // Delete/deactivate user
    static deleteUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        // Check permissions - only admin can delete users
        if (req.user?.role !== 'admin') {
            return next(new AppError('Only administrators can delete users', 403));
        }

        // Prevent admin from deleting themselves
        if (req.user._id.toString() === id) {
            return next(new AppError('You cannot delete your own account', 400));
        }

        const user = await User.findById(id);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Instead of hard delete, deactivate the user
        user.isActive = false;
        await user.save();

        logger.info('User deactivated', {
            userId: user._id,
            deactivatedBy: req.user._id
        });

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    });

    // Reactivate user
    static reactivateUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;

        // Check permissions - only admin can reactivate users
        if (req.user?.role !== 'admin') {
            return next(new AppError('Only administrators can reactivate users', 403));
        }

        const user = await User.findById(id);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        user.isActive = true;
        await user.save();

        logger.info('User reactivated', {
            userId: user._id,
            reactivatedBy: req.user._id
        });

        res.json({
            success: true,
            message: 'User reactivated successfully'
        });
    });

    // Change password
    static changePassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Check permissions - admin or the user themselves
        const isOwnProfile = req.user?._id.toString() === id;
        const isAdmin = req.user?.role === 'admin';

        if (!isAdmin && !isOwnProfile) {
            return next(new AppError("Not authorized to change this user's password", 403));
        }

        const user = await User.findById(id).select('+password +refreshTokens');
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // If changing own password, verify current password
        if (isOwnProfile && !isAdmin) {
            if (!currentPassword) {
                return next(new AppError('Current password is required', 400));
            }

            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return next(new AppError('Current password is incorrect', 400));
            }
        }

        // Update password
        user.password = newPassword;

        // Revoke all refresh tokens for security
        user.refreshTokens = [];

        await user.save();

        logger.info('Password changed', {
            userId: user._id,
            changedBy: req.user!._id,
            isOwnPassword: isOwnProfile
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    });

    // Get user statistics (admin only)
    static getUserStatistics = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
                    verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
                    adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
                    organizerUsers: { $sum: { $cond: [{ $eq: ['$role', 'organizer'] }, 1, 0] } },
                    regularUsers: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } }
                }
            }
        ]);

        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        const result = {
            overview: stats[0] || {
                totalUsers: 0,
                activeUsers: 0,
                verifiedUsers: 0,
                adminUsers: 0,
                organizerUsers: 0,
                regularUsers: 0
            },
            growth: userGrowth
        };

        res.json({
            success: true,
            data: result
        });
    });

    // Update profile (current user)
    static updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { firstName, lastName } = req.body;

        const user = await User.findById(req.user!._id);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;

        await user.save();

        logger.info('Profile updated', {
            userId: user._id,
            fieldsUpdated: Object.keys(req.body)
        });

        const updatedUser = await User.findById(req.user!._id).select('-password -refreshTokens');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    });
}

export default UserController;
