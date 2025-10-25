import app from "./app.js";
import prisma from "./client.js";
import config from "./config/config.js";
import logger from "./config/logger.js";
let server;
console.log('Starting');
async function main() {
    await prisma.$connect();
    logger.info('Connected to SQL Database');
    server = app.listen(config.port, () => {
        logger.info(`Listening to port ${config.port}`);
    });
    const exitHandler = () => {
        if (server) {
            server.close(() => {
                logger.info('Server closed');
                process.exit(1);
            });
        }
        else {
            process.exit(1);
        }
    };
    const unexpectedErrorHandler = (error) => {
        logger.error(error);
        exitHandler();
    };
    process.on('uncaughtException', unexpectedErrorHandler);
    process.on('unhandledRejection', unexpectedErrorHandler);
    process.on('SIGTERM', () => {
        logger.info('SIGTERM received');
        if (server) {
            server.close();
        }
    });
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
