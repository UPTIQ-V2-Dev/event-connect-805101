import mongoose from 'mongoose';
import config from '../config';
import Database from '../utils/database';

// Set test environment
process.env.NODE_ENV = 'test';

// Test database setup
beforeAll(async () => {
    // Connect to test database
    await Database.connect();
});

afterAll(async () => {
    // Clean up and close database connection
    await Database.disconnect();
});

beforeEach(async () => {
    // Clear database before each test
    await Database.clearDatabase();
});

// Increase timeout for database operations
jest.setTimeout(30000);

export {};
