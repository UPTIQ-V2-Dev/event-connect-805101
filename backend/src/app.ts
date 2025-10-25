import config from './config/config.ts';
import morgan from './config/morgan.ts';
import { jwtStrategy } from './config/passport.ts';
import { errorConverter, errorHandler } from './middlewares/error.ts';
import { authLimiter } from './middlewares/rateLimiter.ts';
import xss from './middlewares/xss.ts';
import routes from './routes/v1/index.ts';
import ApiError from './utils/ApiError.ts';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import httpStatus from 'http-status';
import passport from 'passport';

const app = express();

if (config.env !== 'test') {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
// app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
    app.use('/api/v1/auth', authLimiter);
}

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/api/v1/health', (req, res) => {
    res.send('OK');
});

// v1 api routes
app.use('/api/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
