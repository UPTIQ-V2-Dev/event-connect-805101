import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
    // Server Configuration
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || 'localhost',

    // Database Configuration
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/event-rsvp-manager',
        testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/event-rsvp-manager-test',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-change-this-in-production',
        refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'
    },

    // Cookie Configuration
    cookie: {
        secret: process.env.COOKIE_SECRET || 'your-cookie-secret-change-this-in-production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const
    },

    // Email Configuration
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    },

    // Frontend URL
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // File Upload Configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
        uploadDir: process.env.UPLOAD_DIR || 'uploads'
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
    },

    // Redis Configuration (optional)
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/app.log'
    },

    // CORS Configuration
    cors: {
        origin: process.env.NODE_ENV === 'production' ? [process.env.FRONTEND_URL || 'http://localhost:3000'] : true,
        credentials: true,
        optionsSuccessStatus: 200
    },

    // Security Configuration
    security: {
        bcryptSaltRounds: 12,
        passwordResetExpiry: 10 * 60 * 1000, // 10 minutes
        emailVerificationExpiry: 24 * 60 * 60 * 1000, // 24 hours
        maxRefreshTokens: 5 // Maximum refresh tokens per user
    },

    // Pagination defaults
    pagination: {
        defaultLimit: 10,
        maxLimit: 100
    },

    // Message configuration
    messaging: {
        maxRecipientsPerMessage: 1000,
        maxMessagesPerHour: 20,
        templateVariablePattern: /{{(\w+)}}/g
    },

    // Event configuration
    event: {
        maxCapacity: 10000,
        maxCategories: 5,
        maxTags: 10,
        reminderIntervals: [
            { days: 7, name: '1 week before' },
            { days: 1, name: '1 day before' },
            { hours: 2, name: '2 hours before' }
        ]
    },

    // API Configuration
    api: {
        version: 'v1',
        prefix: '/api'
    }
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'];

if (config.env === 'production') {
    requiredEnvVars.push('MONGODB_URI', 'SMTP_USER', 'SMTP_PASS');
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export default config;
