import winston from 'winston';
import path from 'path';
import config from '../config';

// Create logs directory if it doesn't exist
const logsDir = path.dirname(config.logging.file);

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        if (stack) {
            msg += `\n${stack}`;
        }

        if (Object.keys(meta).length > 0) {
            msg += `\n${JSON.stringify(meta, null, 2)}`;
        }

        return msg;
    })
);

const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'event-rsvp-api' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Write all logs to the main log file
        new winston.transports.File({
            filename: config.logging.file,
            maxsize: 5242880, // 5MB
            maxFiles: 10
        })
    ],

    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ],

    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ]
});

// If we're not in production, log to the console with a simple format
if (config.env !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat
        })
    );
}

// Create a stream object for Morgan HTTP request logging
const stream = {
    write: (message: string) => {
        logger.info(message.trim());
    }
};

// Helper functions for structured logging
const logError = (error: Error, context?: Record<string, any>) => {
    logger.error({
        message: error.message,
        stack: error.stack,
        ...context
    });
};

const logInfo = (message: string, context?: Record<string, any>) => {
    logger.info({
        message,
        ...context
    });
};

const logWarn = (message: string, context?: Record<string, any>) => {
    logger.warn({
        message,
        ...context
    });
};

const logDebug = (message: string, context?: Record<string, any>) => {
    logger.debug({
        message,
        ...context
    });
};

// Express request logger
const requestLogger = (req: any) => {
    logger.info({
        message: 'HTTP Request',
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
    });
};

export { logger as default, stream, logError, logInfo, logWarn, logDebug, requestLogger };
