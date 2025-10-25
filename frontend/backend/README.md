# Event RSVP Manager - Backend API

A comprehensive Node.js/Express backend API for managing events, RSVPs, and communications, built with TypeScript and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens, role-based access control
- **Event Management**: Create, update, delete, and manage events with comprehensive filtering
- **RSVP System**: Handle RSVPs from registered users and guests with status tracking
- **Communication**: Send emails to attendees with customizable templates
- **Dashboard Analytics**: Real-time statistics and performance metrics
- **Public RSVP**: Allow guests to RSVP without registration using secure tokens
- **Rate Limiting**: Protect against abuse with configurable rate limits
- **Comprehensive Validation**: Input validation using Joi schemas
- **Logging**: Structured logging with Winston
- **Error Handling**: Centralized error handling with detailed responses

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Email**: Nodemailer
- **Logging**: Winston
- **Security**: Helmet, CORS
- **Rate Limiting**: express-rate-limit

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # Route definitions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── dist/                # Compiled JavaScript (generated)
├── logs/                # Application logs (generated)
├── uploads/             # File uploads (generated)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance
- SMTP server (for email functionality)

### Setup

1. **Clone and navigate to the backend directory**:

    ```bash
    cd backend
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Environment Configuration**:

    ```bash
    cp .env.example .env
    ```

    Edit `.env` with your configuration:

    ```env
    NODE_ENV=development
    PORT=5000
    HOST=localhost

    MONGODB_URI=mongodb://localhost:27017/event-rsvp-manager

    JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
    JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
    COOKIE_SECRET=your-cookie-secret-change-this-in-production

    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your-email@gmail.com
    SMTP_PASS=your-app-password

    FRONTEND_URL=http://localhost:3000
    ```

4. **Start the development server**:
    ```bash
    npm run dev
    ```

## API Endpoints

### Authentication (`/api/v1/auth`)

- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Logout user
- `POST /logout-all` - Logout from all devices
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `GET /verify-email/:token` - Verify email address
- `GET /profile` - Get current user profile

### User Management (`/api/v1/users`)

- `GET /` - Get all users (admin)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update current user profile
- `GET /statistics` - Get user statistics (admin)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Deactivate user (admin)
- `POST /:id/reactivate` - Reactivate user (admin)
- `PUT /:id/password` - Change user password

### Events (`/api/v1/events`)

- `GET /` - Get all events with filtering
- `POST /` - Create new event
- `GET /:id` - Get event by ID
- `PUT /:id` - Update event
- `DELETE /:id` - Delete event
- `GET /:id/attendees` - Get event attendees
- `GET /:id/stats` - Get event statistics
- `POST /:id/duplicate` - Duplicate event

### RSVP Management (`/api/v1/events`)

- `POST /:id/rsvp` - RSVP to event (authenticated users)
- `GET /:id/rsvp` - Get user's RSVP for event
- `PUT /:id/attendees/:attendeeId/status` - Update attendee status
- `DELETE /:id/attendees/:attendeeId` - Remove attendee
- `PUT /:id/attendees/bulk` - Bulk update attendees
- `GET /:id/attendees/export` - Export attendees
- `GET /:id/attendees/check-in-stats` - Get check-in statistics

### Dashboard (`/api/v1/dashboard`)

- `GET /stats` - Get dashboard statistics
- `GET /events-over-time` - Get event statistics over time
- `GET /rsvp-trends` - Get RSVP trends
- `GET /upcoming-events` - Get upcoming events summary
- `GET /performance` - Get performance metrics

### Communications (`/api/v1`)

- `POST /events/:id/messages` - Send message to attendees
- `GET /events/:id/messages` - Get event messages
- `GET /message-templates` - Get message templates
- `POST /message-templates` - Create message template
- `PUT /message-templates/:id` - Update message template
- `DELETE /message-templates/:id` - Delete message template
- `POST /messages/process-scheduled` - Process scheduled messages

### Public RSVP (`/api/v1/public`)

- `GET /events/:token` - Get public event details
- `POST /events/:token/rsvp` - Submit public RSVP
- `GET /events/:token/rsvp/:rsvpToken` - Get public RSVP for editing
- `PUT /events/:token/rsvp/:rsvpToken` - Update public RSVP
- `GET /events/:token/attendee-count` - Get public attendee count

## Database Models

### User

- Authentication and profile information
- Role-based permissions (admin, organizer, user)
- Password hashing and refresh token management

### Event

- Comprehensive event details (title, description, dates, location)
- RSVP settings and capacity management
- Public RSVP token for guest access

### Attendee

- RSVP responses for both registered users and guests
- Status tracking (attending, not-attending, maybe, pending)
- Check-in functionality and dietary restrictions

### Message

- Event communications with various recipient filters
- Scheduled message support
- Delivery status tracking

### MessageTemplate

- Reusable email templates with variable substitution
- Default system templates and custom user templates

## Security Features

- **JWT Authentication**: Access and refresh tokens with configurable expiry
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: Configurable limits for different endpoints
- **Input Validation**: Comprehensive validation using Joi schemas
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: Security headers and XSS protection
- **Environment Variables**: Secure configuration management

## Error Handling

- Centralized error handling with detailed error responses
- Development vs production error formats
- Structured error logging
- Validation error formatting
- Database error handling

## Logging

- Structured logging with Winston
- Configurable log levels and outputs
- Request/response logging with Morgan
- Error tracking and debugging
- Log file rotation

## Development

### Scripts

```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to JavaScript
npm start           # Start production server
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm test           # Run tests
```

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (recommended)
- Jest for testing (configured)

## Production Deployment

1. **Build the application**:

    ```bash
    npm run build
    ```

2. **Set production environment variables**:
    - Set `NODE_ENV=production`
    - Configure production database URI
    - Set secure JWT secrets
    - Configure SMTP settings

3. **Start the server**:
    ```bash
    npm start
    ```

### Environment Variables (Production)

Ensure these are set in production:

- `NODE_ENV=production`
- `MONGODB_URI` (production database)
- `JWT_SECRET` (strong secret key)
- `JWT_REFRESH_SECRET` (different from JWT_SECRET)
- `COOKIE_SECRET` (secure cookie secret)
- `SMTP_USER` and `SMTP_PASS` (email credentials)
- `FRONTEND_URL` (production frontend URL)

## Health Checks

- `GET /health` - Basic health check
- `GET /health/database` - Database connectivity check

## Rate Limiting

Default rate limits:

- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Password reset: 3 attempts per hour
- Registration: 5 attempts per hour
- Messages: 20 messages per hour
- Public RSVP: 10 submissions per 15 minutes

## Email Templates

The system includes default email templates for:

- Welcome emails with email verification
- Password reset emails
- Event invitations
- RSVP confirmations
- Event reminders

Templates support variable substitution for personalization.

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "message": "Optional message",
  "data": {},
  "pagination": {}, // For paginated responses
  "errors": [] // For validation errors
}
```

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for all new code
3. Add appropriate validation and error handling
4. Include logging for important operations
5. Test your changes thoroughly
6. Follow the established API response format

## License

MIT License - see LICENSE file for details.
