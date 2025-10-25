import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import logger from '../utils/logger';
import config from '../config';

interface ApiError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}

class AppError extends Error implements ApiError {
    statusCode: number;
    status: string;
    isOperational: boolean;
    errors?: Array<{
        field: string;
        message: string;
    }>;

    constructor(message: string, statusCode: number, errors?: Array<{ field: string; message: string }>) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }
}

const handleCastErrorDB = (err: any): AppError => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any): AppError => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field!];
    const message = `Duplicate field value: ${field} = '${value}'. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err: MongooseError.ValidationError): AppError => {
    const errors = Object.values(err.errors).map((el: any) => ({
        field: el.path,
        message: el.message
    }));

    const message = 'Invalid input data';
    return new AppError(message, 400, errors);
};

const handleJWTError = (): AppError => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = (): AppError => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err: ApiError, res: Response): void => {
    res.status(err.statusCode || 500).json({
        success: false,
        error: err,
        message: err.message,
        stack: err.stack,
        ...(err.errors && { errors: err.errors })
    });
};

const sendErrorProd = (err: ApiError, res: Response): void => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
            ...(err.errors && { errors: err.errors })
        });
    } else {
        // Programming or other unknown error: don't leak error details
        logger.error('ERROR', err);

        res.status(500).json({
            success: false,
            message: 'Something went wrong!'
        });
    }
};

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.env === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (err.code === 11000) error = handleDuplicateFieldsDB(error);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

// Async error wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler for undefined routes
const notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(error);
};

// Validation error helper
const createValidationError = (message: string, errors: Array<{ field: string; message: string }>): AppError => {
    return new AppError(message, 400, errors);
};

export { AppError, globalErrorHandler, asyncHandler, notFound, createValidationError };

export default globalErrorHandler;
