import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import JWTUtils from '../utils/jwt';
import emailService from '../utils/email';
import config from '../config';
import logger from '../utils/logger';
import crypto from 'crypto';

class AuthController {
    // Register new user
    static register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { email, password, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return next(new AppError('User with this email already exists', 400));
        }

        // Create new user
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            role: 'user'
        });

        // Generate email verification token if email service is configured
        let verificationToken: string | undefined;
        if (config.email.auth.user) {
            verificationToken = JWTUtils.generateEmailVerificationToken();
            user.emailVerificationToken = verificationToken;
            await user.save();

            // Send welcome email with verification link
            try {
                await emailService.sendWelcomeEmail(user.email, user.firstName, verificationToken);
            } catch (error) {
                logger.error('Failed to send welcome email', { error: error.message, userId: user._id });
                // Don't fail registration if email fails
            }
        }

        // Generate tokens
        const { accessToken, refreshToken } = await JWTUtils.generateTokenPair(user);

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            ...config.cookie,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: verificationToken
                ? 'Registration successful! Please check your email to verify your account.'
                : 'Registration successful!',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified
                },
                accessToken
            }
        });
    });

    // Login user
    static login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { email, password, rememberMe } = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');

        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError('Invalid email or password', 401));
        }

        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated. Please contact support.', 401));
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Clean up expired tokens and limit refresh tokens
        await JWTUtils.cleanupExpiredTokens(user);
        await JWTUtils.limitRefreshTokens(user);

        // Generate tokens
        const { accessToken, refreshToken } = await JWTUtils.generateTokenPair(user);

        // Set refresh token as httpOnly cookie
        const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days if remember me, else 7 days

        res.cookie('refreshToken', refreshToken, {
            ...config.cookie,
            maxAge: cookieMaxAge
        });

        logger.info('User logged in successfully', { userId: user._id, email: user.email });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    lastLogin: user.lastLogin
                },
                accessToken
            }
        });
    });

    // Refresh access token
    static refreshToken = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return next(new AppError('Refresh token is required', 401));
        }

        try {
            // Verify refresh token
            const decoded = JWTUtils.verifyRefreshToken(refreshToken);

            // Find user and verify token is in their list
            const user = await User.findById(decoded.userId).select('+refreshTokens');

            if (!user || !user.isActive) {
                return next(new AppError('User not found or inactive', 401));
            }

            if (!user.refreshTokens.includes(refreshToken)) {
                return next(new AppError('Invalid refresh token', 401));
            }

            // Generate new access token
            const newAccessToken = JWTUtils.generateAccessToken(user);

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: newAccessToken,
                    user: {
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isEmailVerified: user.isEmailVerified
                    }
                }
            });
        } catch (error) {
            return next(new AppError('Invalid or expired refresh token', 401));
        }
    });

    // Logout user
    static logout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (refreshToken && req.user) {
            // Remove refresh token from user's token list
            await JWTUtils.revokeRefreshToken(req.user, refreshToken);
        }

        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            ...config.cookie
        });

        logger.info('User logged out successfully', { userId: req.user?._id });

        res.json({
            success: true,
            message: 'Logout successful'
        });
    });

    // Logout from all devices
    static logoutAll = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user) {
            // Remove all refresh tokens
            await JWTUtils.revokeAllRefreshTokens(req.user);
        }

        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            ...config.cookie
        });

        logger.info('User logged out from all devices', { userId: req.user?._id });

        res.json({
            success: true,
            message: 'Logged out from all devices successfully'
        });
    });

    // Request password reset
    static forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Don't reveal whether user exists or not
            return res.json({
                success: true,
                message: 'If an account with that email exists, we have sent a password reset link.'
            });
        }

        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated. Please contact support.', 401));
        }

        // Generate reset token
        const resetToken = JWTUtils.generatePasswordResetToken();
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = new Date(Date.now() + config.security.passwordResetExpiry);

        await user.save();

        // Send reset email
        try {
            await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);

            logger.info('Password reset email sent', { userId: user._id, email: user.email });
        } catch (error) {
            // Reset the fields if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();

            logger.error('Failed to send password reset email', { error: error.message, userId: user._id });
            return next(new AppError('Failed to send password reset email. Please try again later.', 500));
        }

        res.json({
            success: true,
            message: 'Password reset link has been sent to your email address.'
        });
    });

    // Reset password
    static resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { token, password } = req.body;

        // Hash the token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() }
        }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            return next(new AppError('Token is invalid or has expired', 400));
        }

        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated. Please contact support.', 401));
        }

        // Update password and clear reset fields
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        // Also revoke all refresh tokens for security
        await JWTUtils.revokeAllRefreshTokens(user);

        await user.save();

        logger.info('Password reset successful', { userId: user._id, email: user.email });

        res.json({
            success: true,
            message: 'Password has been reset successfully. Please log in with your new password.'
        });
    });

    // Verify email address
    static verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { token } = req.params;

        const user = await User.findOne({
            emailVerificationToken: token
        }).select('+emailVerificationToken');

        if (!user) {
            return next(new AppError('Invalid verification token', 400));
        }

        // Update user as verified
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();

        logger.info('Email verified successfully', { userId: user._id, email: user.email });

        res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified
                }
            }
        });
    });

    // Get current user profile
    static getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user!._id,
                    email: req.user!.email,
                    firstName: req.user!.firstName,
                    lastName: req.user!.lastName,
                    role: req.user!.role,
                    isEmailVerified: req.user!.isEmailVerified,
                    lastLogin: req.user!.lastLogin,
                    createdAt: req.user!.createdAt
                }
            }
        });
    });
}

export default AuthController;
