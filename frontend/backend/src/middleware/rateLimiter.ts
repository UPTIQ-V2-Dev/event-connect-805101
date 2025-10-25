import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '../config';

// General rate limiter
const createRateLimiter = (windowMs: number, max: number, message: string) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message
        },
        headers: true,
        handler: (_req: Request, res: Response) => {
            res.status(429).json({
                success: false,
                message
            });
        }
    });
};

// Default rate limiter for general API requests
const generalLimiter = createRateLimiter(
    config.rateLimit.windowMs, // 15 minutes
    config.rateLimit.maxRequests, // 100 requests per windowMs
    'Too many requests from this IP, please try again later.'
);

// Strict rate limiter for authentication endpoints
const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts per windowMs
    'Too many authentication attempts, please try again later.'
);

// Stricter rate limiter for password reset
const passwordResetLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    3, // 3 attempts per hour
    'Too many password reset attempts, please try again later.'
);

// Rate limiter for registration
const registrationLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    5, // 5 registrations per hour
    'Too many registration attempts, please try again later.'
);

// Rate limiter for message sending
const messageLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    20, // 20 messages per hour
    'Too many messages sent, please try again later.'
);

// Rate limiter for public RSVP
const rsvpLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    10, // 10 RSVP submissions per 15 minutes
    'Too many RSVP submissions, please try again later.'
);

// Rate limiter for API key generation/refresh
const apiKeyLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    3, // 3 API key operations per hour
    'Too many API key operations, please try again later.'
);

export {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    registrationLimiter,
    messageLimiter,
    rsvpLimiter,
    apiKeyLimiter,
    createRateLimiter
};
