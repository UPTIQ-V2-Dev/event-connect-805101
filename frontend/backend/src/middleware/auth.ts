import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { IUserDocument } from '../models/User';
import config from '../config';

interface AuthRequest extends Request {
    user?: IUserDocument;
}

interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

class AuthMiddleware {
    // Verify JWT token and attach user to request
    static async authenticate(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access token is required'
                });
            }

            try {
                const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

                const user = await User.findById(decoded.userId).select('-password -refreshTokens');
                if (!user || !user.isActive) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid token - user not found or inactive'
                    });
                }

                req.user = user;
                next();
            } catch (jwtError) {
                if (jwtError instanceof jwt.TokenExpiredError) {
                    return res.status(401).json({
                        success: false,
                        message: 'Access token expired',
                        code: 'TOKEN_EXPIRED'
                    });
                }

                return res.status(401).json({
                    success: false,
                    message: 'Invalid access token'
                });
            }
        } catch (error) {
            next(error);
        }
    }

    // Optional authentication - doesn't fail if no token provided
    static async optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return next(); // No token provided, continue without user
            }

            try {
                const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

                const user = await User.findById(decoded.userId).select('-password -refreshTokens');
                if (user && user.isActive) {
                    req.user = user;
                }
            } catch (jwtError) {
                // Ignore JWT errors in optional auth, just continue without user
            }

            next();
        } catch (error) {
            next(error);
        }
    }

    // Role-based authorization
    static authorize(...roles: string[]) {
        return (req: AuthRequest, res: Response, next: NextFunction) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }

            next();
        };
    }

    // Check if user is admin
    static requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
        return AuthMiddleware.authorize('admin')(req, res, next);
    }

    // Check if user is organizer or admin
    static requireOrganizerOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
        return AuthMiddleware.authorize('admin', 'organizer')(req, res, next);
    }

    // Check if user owns the resource or is admin
    static requireOwnershipOrAdmin(resourceUserIdField: string = 'userId') {
        return (req: AuthRequest, res: Response, next: NextFunction) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

            if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied - insufficient permissions'
            });
        };
    }

    // Verify refresh token
    static async verifyRefreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            try {
                const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JWTPayload;

                const user = await User.findById(decoded.userId).select('+refreshTokens');
                if (!user || !user.isActive) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid refresh token - user not found or inactive'
                    });
                }

                // Check if refresh token exists in user's token list
                if (!user.refreshTokens.includes(refreshToken)) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid refresh token'
                    });
                }

                (req as AuthRequest).user = user;
                next();
            } catch (jwtError) {
                if (jwtError instanceof jwt.TokenExpiredError) {
                    return res.status(401).json({
                        success: false,
                        message: 'Refresh token expired',
                        code: 'REFRESH_TOKEN_EXPIRED'
                    });
                }

                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }
        } catch (error) {
            next(error);
        }
    }
}

export default AuthMiddleware;

// Export individual methods for convenience
export const {
    authenticate,
    optionalAuth,
    authorize,
    requireAdmin,
    requireOrganizerOrAdmin,
    requireOwnershipOrAdmin,
    verifyRefreshToken
} = AuthMiddleware;

// Export types
export type { AuthRequest };
