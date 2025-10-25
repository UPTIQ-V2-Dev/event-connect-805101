import { PrismaClient } from './generated/prisma/index.js';

// add prisma to the NodeJS global type
// interface CustomNodeJsGlobal extends Global {
//   prisma: PrismaClient;
// }

// Prevent multiple instances of Prisma Client in development
// declare const global: CustomNodeJsGlobal;

const prisma = new PrismaClient();

export default prisma;
