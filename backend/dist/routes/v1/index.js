import config from "../../config/config.js";
import attendeeRoute from "./attendee.route.js";
import authRoute from "./auth.route.js";
import dashboardRoute from "./dashboard.route.js";
import docsRoute from "./docs.route.js";
import eventRoute from "./event.route.js";
import mcpRoute from "./mcp.route.js";
import messageRoute from "./message.route.js";
import messageTemplateRoute from "./messageTemplate.route.js";
import userRoute from "./user.route.js";
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
