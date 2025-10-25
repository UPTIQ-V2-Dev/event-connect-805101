import config from "../config/config.js";
import logger from "../config/logger.js";
import { Prisma } from '../generated/prisma/index.js';
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
export const errorConverter = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || error instanceof Prisma.PrismaClientKnownRequestError
            ? httpStatus.BAD_REQUEST
            : httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message || httpStatus[statusCode];
        error = new ApiError(statusCode, message, false, err.stack);
    }
    next(error);
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    if (config.env === 'production' && !err.isOperational) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    }
    res.locals.errorMessage = err.message;
    console.log('in error');
    const response = {
        code: statusCode,
        message,
        ...(config.env === 'development' && { stack: err.stack })
    };
    if (config.env === 'development') {
        logger.error(err);
    }
    res.status(statusCode).send(response);
};
