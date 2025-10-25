import mongoose from 'mongoose';
import config from '../config';
import logger from './logger';
import { MessageTemplate } from '../models';

class Database {
    static async connect(): Promise<void> {
        try {
            const uri = config.env === 'test' ? config.database.testUri : config.database.uri;

            await mongoose.connect(uri);

            logger.info(`MongoDB connected successfully to ${config.env} database`);

            // Set up connection event listeners
            mongoose.connection.on('error', error => {
                logger.error('MongoDB connection error:', error);
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                logger.info('MongoDB reconnected');
            });

            // Initialize default data
            await this.initializeDefaultData();
        } catch (error) {
            logger.error('MongoDB connection failed:', error);
            process.exit(1);
        }
    }

    static async disconnect(): Promise<void> {
        try {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
        } catch (error) {
            logger.error('Error closing MongoDB connection:', error);
        }
    }

    static async clearDatabase(): Promise<void> {
        if (config.env !== 'test') {
            throw new Error('Database clearing is only allowed in test environment');
        }

        try {
            const collections = await mongoose.connection.db.collections();

            for (const collection of collections) {
                await collection.deleteMany({});
            }

            logger.info('Test database cleared');
        } catch (error) {
            logger.error('Error clearing test database:', error);
            throw error;
        }
    }

    static async initializeDefaultData(): Promise<void> {
        try {
            // Create default message templates
            await MessageTemplate.createDefaultTemplates();

            logger.info('Default data initialized');
        } catch (error) {
            logger.error('Error initializing default data:', error);
            // Don't throw error here as it might prevent app startup
        }
    }

    static getConnectionState(): string {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
    }

    static async healthCheck(): Promise<{
        status: string;
        message: string;
        details: {
            state: string;
            host?: string;
            database?: string;
        };
    }> {
        try {
            const state = this.getConnectionState();

            if (state === 'connected') {
                // Try a simple operation to verify connectivity
                await mongoose.connection.db.admin().ping();

                return {
                    status: 'healthy',
                    message: 'Database connection is healthy',
                    details: {
                        state,
                        host: mongoose.connection.host,
                        database: mongoose.connection.name
                    }
                };
            } else {
                return {
                    status: 'unhealthy',
                    message: `Database is ${state}`,
                    details: {
                        state
                    }
                };
            }
        } catch (error) {
            logger.error('Database health check failed:', error);

            return {
                status: 'unhealthy',
                message: 'Database health check failed',
                details: {
                    state: this.getConnectionState()
                }
            };
        }
    }

    // Transaction helper
    static async withTransaction<T>(operation: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
        const session = await mongoose.startSession();

        try {
            return await session.withTransaction(operation);
        } finally {
            await session.endSession();
        }
    }

    // Aggregation pipeline builder helpers
    static buildPaginationPipeline(page: number, limit: number, sortField = 'createdAt', sortOrder = 'desc') {
        const skip = (page - 1) * limit;
        const sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };

        return [
            {
                $facet: {
                    data: [{ $sort: sort }, { $skip: skip }, { $limit: limit }],
                    totalCount: [{ $count: 'total' }]
                }
            },
            {
                $project: {
                    data: 1,
                    total: { $ifNull: [{ $arrayElemAt: ['$totalCount.total', 0] }, 0] },
                    page: { $literal: page },
                    limit: { $literal: limit },
                    pages: {
                        $ceil: {
                            $divide: [{ $ifNull: [{ $arrayElemAt: ['$totalCount.total', 0] }, 0] }, limit]
                        }
                    }
                }
            }
        ];
    }

    static buildSearchPipeline(searchTerm: string, fields: string[]) {
        if (!searchTerm) return [];

        return [
            {
                $match: {
                    $or: fields.map(field => ({
                        [field]: { $regex: searchTerm, $options: 'i' }
                    }))
                }
            }
        ];
    }
}

export default Database;
