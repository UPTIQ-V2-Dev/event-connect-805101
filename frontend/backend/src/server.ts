import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

import config from './config';
import Database from './utils/database';
import logger, { stream } from './utils/logger';
import { globalErrorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import routes from './routes';

class Server {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
        // Trust proxy (important for rate limiting and IP detection)
        this.app.set('trust proxy', 1);

        // Security middleware
        this.app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        scriptSrc: ["'self'"],
                        imgSrc: ["'self'", 'data:', 'https:']
                    }
                },
                crossOriginEmbedderPolicy: false
            })
        );

        // CORS configuration
        this.app.use(cors(config.cors));

        // Compression middleware
        this.app.use(compression());

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Cookie parser
        this.app.use(cookieParser(config.cookie.secret));

        // HTTP request logging
        const morganFormat =
            config.env === 'production'
                ? 'combined'
                : ':remote-addr :method :url :status :res[content-length] - :response-time ms';

        this.app.use(morgan(morganFormat, { stream }));

        // Rate limiting
        this.app.use(generalLimiter);

        // Create logs directory if it doesn't exist
        const logsDir = path.dirname(config.logging.file);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(config.upload.uploadDir)) {
            fs.mkdirSync(config.upload.uploadDir, { recursive: true });
        }
    }

    private setupRoutes(): void {
        // API routes
        this.app.use(`${config.api.prefix}/${config.api.version}`, routes);

        // Serve static files (for uploaded files)
        this.app.use('/uploads', express.static(config.upload.uploadDir));

        // Health check endpoint (outside API versioning)
        this.app.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'Event RSVP Manager API is running',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: config.env,
                database: Database.getConnectionState()
            });
        });

        // Database health check
        this.app.get('/health/database', async (req, res) => {
            try {
                const healthCheck = await Database.healthCheck();
                res.status(healthCheck.status === 'healthy' ? 200 : 503).json({
                    success: healthCheck.status === 'healthy',
                    ...healthCheck
                });
            } catch (error) {
                res.status(503).json({
                    success: false,
                    status: 'unhealthy',
                    message: 'Database health check failed'
                });
            }
        });

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Welcome to Event RSVP Manager API',
                version: '1.0.0',
                documentation: `${config.frontendUrl}/api-docs`,
                endpoints: {
                    health: '/health',
                    api: `${config.api.prefix}/${config.api.version}`
                }
            });
        });
    }

    private setupErrorHandling(): void {
        // 404 handler for undefined routes
        this.app.use(notFound);

        // Global error handler
        this.app.use(globalErrorHandler);
    }

    public async start(): Promise<void> {
        try {
            // Connect to database
            await Database.connect();

            // Start server
            const server = this.app.listen(config.port, config.host, () => {
                logger.info(`🚀 Server is running on http://${config.host}:${config.port}`);
                logger.info(`📝 Environment: ${config.env}`);
                logger.info(`📊 API Documentation: ${config.frontendUrl}/api-docs`);
                logger.info(`🏥 Health Check: http://${config.host}:${config.port}/health`);
            });

            // Graceful shutdown
            this.setupGracefulShutdown(server);

            // Handle unhandled promise rejections
            process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
                logger.error('Unhandled Rejection at:', { promise, reason });
                this.shutdown(server, 1);
            });

            // Handle uncaught exceptions
            process.on('uncaughtException', (error: Error) => {
                logger.error('Uncaught Exception:', error);
                this.shutdown(server, 1);
            });
        } catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    private setupGracefulShutdown(server: any): void {
        const shutdown = (signal: string) => {
            logger.info(`Received ${signal}. Shutting down gracefully...`);
            this.shutdown(server, 0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    private async shutdown(server: any, exitCode: number): Promise<void> {
        try {
            // Close server
            server.close(async () => {
                logger.info('HTTP server closed');

                // Close database connection
                await Database.disconnect();

                logger.info('Graceful shutdown completed');
                process.exit(exitCode);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(exitCode);
            }, 10000);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }

    public getApp(): express.Application {
        return this.app;
    }
}

// Create and start server
const server = new Server();

// Start server if this file is run directly
if (require.main === module) {
    server.start().catch(error => {
        logger.error('Failed to start application:', error);
        process.exit(1);
    });
}

export default server;
export { Server };
