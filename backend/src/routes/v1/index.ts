import config from '../../config/config.ts';
import attendeeRoute from './attendee.route.ts';
import authRoute from './auth.route.ts';
import dashboardRoute from './dashboard.route.ts';
import docsRoute from './docs.route.ts';
import eventRoute from './event.route.ts';
import mcpRoute from './mcp.route.ts';
import messageRoute from './message.route.ts';
import messageTemplateRoute from './messageTemplate.route.ts';
import userRoute from './user.route.ts';
import express from 'express';

const router = express.Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute
    },
    {
        path: '/dashboard',
        route: dashboardRoute
    },
    {
        path: '/events',
        route: eventRoute
    },
    {
        path: '/users',
        route: userRoute
    },
    {
        path: '/',
        route: attendeeRoute
    },
    {
        path: '/mcp',
        route: mcpRoute
    },
    {
        path: '/messages',
        route: messageRoute
    },
    {
        path: '/message-templates',
        route: messageTemplateRoute
    }
];

const devRoutes = [
    // routes available only in development mode
    {
        path: '/docs',
        route: docsRoute
    }
];

defaultRoutes.forEach(route => {
    router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
    devRoutes.forEach(route => {
        router.use(route.path, route.route);
    });
}

export default router;
