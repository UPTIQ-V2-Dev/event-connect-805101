import { PrismaClient } from '../generated/prisma/index.js';

export function getPrismaClient() {
    return new PrismaClient();
}
