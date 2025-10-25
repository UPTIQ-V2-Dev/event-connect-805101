import config from "../config/config.js";
const swaggerDef = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API documentation',
            version: '1'
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api/v1`
            }
        ]
    },
    apis: ['src/docs/*.yml', 'src/routes/v1/*.ts']
};
export default swaggerDef;
