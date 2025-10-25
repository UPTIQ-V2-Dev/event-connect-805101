import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { createValidationError } from './errorHandler';

// Validation middleware factory
const validate = (schema: Joi.ObjectSchema, property: 'body' | 'params' | 'query' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return next(createValidationError('Validation failed', errors));
        }

        req[property] = value;
        next();
    };
};

// Auth validation schemas
const authSchemas = {
    register: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: Joi.string().min(8).required().messages({
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'Password is required'
        }),
        firstName: Joi.string().trim().min(1).max(50).required().messages({
            'string.min': 'First name is required',
            'string.max': 'First name cannot exceed 50 characters',
            'any.required': 'First name is required'
        }),
        lastName: Joi.string().trim().min(1).max(50).required().messages({
            'string.min': 'Last name is required',
            'string.max': 'Last name cannot exceed 50 characters',
            'any.required': 'Last name is required'
        })
    }),

    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: Joi.string().required().messages({
            'any.required': 'Password is required'
        }),
        rememberMe: Joi.boolean().optional()
    }),

    refreshToken: Joi.object({
        refreshToken: Joi.string().required().messages({
            'any.required': 'Refresh token is required'
        })
    }),

    forgotPassword: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        })
    }),

    resetPassword: Joi.object({
        token: Joi.string().required().messages({
            'any.required': 'Reset token is required'
        }),
        password: Joi.string().min(8).required().messages({
            'string.min': 'Password must be at least 8 characters long',
            'any.required': 'Password is required'
        })
    })
};

// Event validation schemas
const eventSchemas = {
    create: Joi.object({
        title: Joi.string().trim().min(1).max(200).required().messages({
            'string.min': 'Event title is required',
            'string.max': 'Event title cannot exceed 200 characters',
            'any.required': 'Event title is required'
        }),
        description: Joi.string().trim().min(1).max(2000).required().messages({
            'string.min': 'Event description is required',
            'string.max': 'Event description cannot exceed 2000 characters',
            'any.required': 'Event description is required'
        }),
        startDate: Joi.date().iso().greater('now').required().messages({
            'date.greater': 'Start date must be in the future',
            'any.required': 'Start date is required'
        }),
        endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
            'date.greater': 'End date must be after start date',
            'any.required': 'End date is required'
        }),
        timezone: Joi.string().required().messages({
            'any.required': 'Timezone is required'
        }),
        location: Joi.object({
            type: Joi.string().valid('physical', 'virtual', 'hybrid').required(),
            address: Joi.string().when('type', {
                is: Joi.valid('physical', 'hybrid'),
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            virtualLink: Joi.string()
                .uri()
                .when('type', {
                    is: Joi.valid('virtual', 'hybrid'),
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
            city: Joi.string().optional(),
            state: Joi.string().optional(),
            country: Joi.string().optional(),
            postalCode: Joi.string().optional()
        }).required(),
        capacity: Joi.number().integer().min(1).max(10000).optional(),
        rsvpDeadline: Joi.date().iso().max(Joi.ref('startDate')).optional().messages({
            'date.max': 'RSVP deadline must be before or equal to start date'
        }),
        isPublic: Joi.boolean().required(),
        categories: Joi.array().items(Joi.string()).max(5).optional(),
        tags: Joi.array().items(Joi.string()).max(10).optional(),
        settings: Joi.object({
            allowGuestInvites: Joi.boolean().optional(),
            requireApproval: Joi.boolean().optional(),
            sendReminders: Joi.boolean().optional(),
            collectDietaryRestrictions: Joi.boolean().optional(),
            collectGuestInfo: Joi.boolean().optional()
        }).optional()
    }),

    update: Joi.object({
        title: Joi.string().trim().min(1).max(200).optional(),
        description: Joi.string().trim().min(1).max(2000).optional(),
        startDate: Joi.date().iso().greater('now').optional(),
        endDate: Joi.date().iso().optional(),
        timezone: Joi.string().optional(),
        location: Joi.object({
            type: Joi.string().valid('physical', 'virtual', 'hybrid').required(),
            address: Joi.string().when('type', {
                is: Joi.valid('physical', 'hybrid'),
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            virtualLink: Joi.string()
                .uri()
                .when('type', {
                    is: Joi.valid('virtual', 'hybrid'),
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
            city: Joi.string().optional(),
            state: Joi.string().optional(),
            country: Joi.string().optional(),
            postalCode: Joi.string().optional()
        }).optional(),
        capacity: Joi.number().integer().min(1).max(10000).optional(),
        rsvpDeadline: Joi.date().iso().optional(),
        isPublic: Joi.boolean().optional(),
        categories: Joi.array().items(Joi.string()).max(5).optional(),
        tags: Joi.array().items(Joi.string()).max(10).optional(),
        settings: Joi.object({
            allowGuestInvites: Joi.boolean().optional(),
            requireApproval: Joi.boolean().optional(),
            sendReminders: Joi.boolean().optional(),
            collectDietaryRestrictions: Joi.boolean().optional(),
            collectGuestInfo: Joi.boolean().optional()
        }).optional(),
        status: Joi.string().valid('draft', 'published', 'cancelled').optional()
    })
};

// RSVP validation schemas
const rsvpSchemas = {
    create: Joi.object({
        rsvpStatus: Joi.string().valid('attending', 'not-attending', 'maybe').required(),
        guestInfo: Joi.object({
            firstName: Joi.string().trim().min(1).max(50).required(),
            lastName: Joi.string().trim().min(1).max(50).required(),
            email: Joi.string().email().required(),
            phone: Joi.string().optional()
        }).optional(),
        dietaryRestrictions: Joi.string().max(500).optional(),
        additionalNotes: Joi.string().max(1000).optional()
    }),

    update: Joi.object({
        rsvpStatus: Joi.string().valid('attending', 'not-attending', 'maybe').required(),
        dietaryRestrictions: Joi.string().max(500).optional(),
        additionalNotes: Joi.string().max(1000).optional()
    })
};

// Message validation schemas
const messageSchemas = {
    send: Joi.object({
        subject: Joi.string().trim().min(1).max(200).required(),
        content: Joi.string().trim().min(1).max(5000).required(),
        messageType: Joi.string().valid('announcement', 'reminder', 'update', 'invitation').required(),
        recipients: Joi.object({
            type: Joi.string().valid('all', 'attending', 'not-attending', 'maybe', 'pending', 'custom').required(),
            userIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
            attendeeIds: Joi.array().items(Joi.string().hex().length(24)).optional()
        }).required(),
        scheduledFor: Joi.date().iso().greater('now').optional(),
        templateId: Joi.string().hex().length(24).optional()
    })
};

// Message template validation schemas
const messageTemplateSchemas = {
    create: Joi.object({
        name: Joi.string().trim().min(1).max(100).required(),
        description: Joi.string().trim().max(500).optional(),
        subject: Joi.string().trim().min(1).max(200).required(),
        content: Joi.string().trim().min(1).max(5000).required(),
        templateType: Joi.string()
            .valid('invitation', 'reminder', 'confirmation', 'update', 'cancellation', 'custom')
            .required(),
        isDefault: Joi.boolean().optional()
    }),

    update: Joi.object({
        name: Joi.string().trim().min(1).max(100).optional(),
        description: Joi.string().trim().max(500).optional(),
        subject: Joi.string().trim().min(1).max(200).optional(),
        content: Joi.string().trim().min(1).max(5000).optional(),
        templateType: Joi.string()
            .valid('invitation', 'reminder', 'confirmation', 'update', 'cancellation', 'custom')
            .optional(),
        isDefault: Joi.boolean().optional()
    })
};

// User validation schemas
const userSchemas = {
    update: Joi.object({
        firstName: Joi.string().trim().min(1).max(50).optional(),
        lastName: Joi.string().trim().min(1).max(50).optional(),
        email: Joi.string().email().optional(),
        role: Joi.string().valid('admin', 'organizer', 'user').optional()
    }),

    changePassword: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).required()
    })
};

// Query validation schemas
const querySchemas = {
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sort: Joi.string().optional(),
        order: Joi.string().valid('asc', 'desc').default('desc')
    }),

    eventFilters: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sort: Joi.string().optional(),
        order: Joi.string().valid('asc', 'desc').default('desc'),
        status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').optional(),
        category: Joi.string().optional(),
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional(),
        search: Joi.string().optional()
    }),

    attendeeFilters: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sort: Joi.string().optional(),
        order: Joi.string().valid('asc', 'desc').default('desc'),
        rsvpStatus: Joi.string().valid('attending', 'not-attending', 'maybe', 'pending').optional(),
        checkedIn: Joi.boolean().optional(),
        search: Joi.string().optional()
    })
};

// MongoDB ObjectId validation
const objectIdSchema = Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid ID format',
    'string.length': 'Invalid ID format',
    'any.required': 'ID is required'
});

// Validation middleware exports
export const validateAuth = {
    register: validate(authSchemas.register),
    login: validate(authSchemas.login),
    refreshToken: validate(authSchemas.refreshToken),
    forgotPassword: validate(authSchemas.forgotPassword),
    resetPassword: validate(authSchemas.resetPassword)
};

export const validateEvent = {
    create: validate(eventSchemas.create),
    update: validate(eventSchemas.update)
};

export const validateRSVP = {
    create: validate(rsvpSchemas.create),
    update: validate(rsvpSchemas.update)
};

export const validateMessage = {
    send: validate(messageSchemas.send)
};

export const validateMessageTemplate = {
    create: validate(messageTemplateSchemas.create),
    update: validate(messageTemplateSchemas.update)
};

export const validateUser = {
    update: validate(userSchemas.update),
    changePassword: validate(userSchemas.changePassword)
};

export const validateQuery = {
    pagination: validate(querySchemas.pagination, 'query'),
    eventFilters: validate(querySchemas.eventFilters, 'query'),
    attendeeFilters: validate(querySchemas.attendeeFilters, 'query')
};

export const validateObjectId = validate(Joi.object({ id: objectIdSchema }), 'params');

export { validate };
export default validate;
