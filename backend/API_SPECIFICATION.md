# API Specification - Event Management System

## Database Models (Prisma Schema)

```prisma
model User {
  id              Int      @id @default(autoincrement())
  email           String   @unique
  name            String?
  password        String
  role            String   @default("USER")
  isEmailVerified Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tokens          Token[]
  events          Event[]
  messages        Message[]
  attendees       Attendee[]
}

model Token {
  id          Int       @id @default(autoincrement())
  token       String
  type        String
  expires     DateTime
  blacklisted Boolean
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
  userId      Int
}

model Event {
  id            String     @id @default(cuid())
  title         String
  description   String
  startDate     DateTime
  endDate       DateTime?
  locationType  String
  address       String?
  virtualLink   String?
  capacity      Int?
  rsvpDeadline  DateTime?
  status        String     @default("draft")
  visibility    String     @default("public")
  createdBy     Int
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  creator       User       @relation(fields: [createdBy], references: [id])
  attendees     Attendee[]
  messages      Message[]
}

model Attendee {
  id                    String    @id @default(cuid())
  eventId               String
  name                  String
  email                 String
  rsvpStatus            String
  dietaryRequirements   String?
  phone                 String?
  company               String?
  registrationDate      DateTime  @default(now())
  event                 Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  registeredBy          User?     @relation(fields: [registeredById], references: [id])
  registeredById        Int?
  
  @@unique([eventId, email])
}

model Message {
  id               String    @id @default(cuid())
  eventId          String
  subject          String
  content          String
  recipientCount   Int       @default(0)
  deliveryStatus   String    @default("draft")
  scheduledDate    DateTime?
  sentDate         DateTime?
  createdBy        Int
  createdAt        DateTime  @default(now())
  rsvpStatusFilter String?
  searchQuery      String?
  dateRangeStart   DateTime?
  dateRangeEnd     DateTime?
  event            Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  creator          User      @relation(fields: [createdBy], references: [id])
}

model MessageTemplate {
  id        String   @id @default(cuid())
  name      String
  subject   String
  content   String
  category  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Endpoints

### Authentication APIs

EP: POST /auth/register
DESC: Register a new user account.
IN: body:{name:str!, email:str!, password:str!}
OUT: 201:{user:obj{id:str, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}, tokens:obj{access:obj{token:str, expires:str}, refresh:obj{token:str, expires:str}}}
ERR: {"400":"Invalid input, missing required fields", "409":"Email already exists", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/register -H "Content-Type: application/json" -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
EX_RES_201: {"user":{"id":"1","email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":false,"createdAt":"2025-10-25T10:00:00Z","updatedAt":"2025-10-25T10:00:00Z"},"tokens":{"access":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","expires":"2025-10-25T11:00:00Z"},"refresh":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","expires":"2025-11-01T10:00:00Z"}}}

---

EP: POST /auth/login
DESC: Login with email and password.
IN: body:{email:str!, password:str!}
OUT: 200:{user:obj{id:str, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}, tokens:obj{access:obj{token:str, expires:str}, refresh:obj{token:str, expires:str}}}
ERR: {"400":"Invalid input, missing required fields", "401":"Invalid email or password", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/login -H "Content-Type: application/json" -d '{"email":"john@example.com","password":"password123"}'
EX_RES_200: {"user":{"id":"1","email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":true,"createdAt":"2025-10-25T10:00:00Z","updatedAt":"2025-10-25T10:00:00Z"},"tokens":{"access":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","expires":"2025-10-25T11:00:00Z"},"refresh":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","expires":"2025-11-01T10:00:00Z"}}}

---

EP: POST /auth/logout
DESC: Logout user and invalidate refresh token.
IN: body:{refreshToken:str!}
OUT: 204:{}
ERR: {"400":"Refresh token is required", "404":"Refresh token not found", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/logout -H "Content-Type: application/json" -d '{"refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
EX_RES_204: {}

---

EP: POST /auth/refresh
DESC: Refresh access token using refresh token.
IN: body:{refreshToken:str!}
OUT: 200:{tokens:obj{access:obj{token:str, expires:str}, refresh:obj{token:str, expires:str}}}
ERR: {"400":"Refresh token is required", "401":"Invalid refresh token", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/refresh -H "Content-Type: application/json" -d '{"refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
EX_RES_200: {"tokens":{"access":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","expires":"2025-10-25T11:00:00Z"},"refresh":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","expires":"2025-11-01T10:00:00Z"}}}

---

### Dashboard APIs

EP: GET /dashboard/stats
DESC: Get dashboard statistics and metrics.
IN: headers:{Authorization:str!}
OUT: 200:{totalEvents:int, activeEvents:int, totalAttendees:int, upcomingEvents:int, recentActivity:obj{newRSVPs:int, messagessent:int, eventsCreated:int}}
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET /dashboard/stats -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_200: {"totalEvents":12,"activeEvents":8,"totalAttendees":450,"upcomingEvents":5,"recentActivity":{"newRSVPs":23,"messagessent":45,"eventsCreated":3}}

---

### Event APIs

EP: GET /events
DESC: Get paginated list of events with optional filtering.
IN: headers:{Authorization:str!}, query:{status:str, search:str, visibility:str, dateStart:str, dateEnd:str, page:int, limit:int}
OUT: 200:{results:arr[obj{id:str, title:str, description:str, startDate:str, endDate:str, location:obj{type:str, address:str, virtualLink:str}, capacity:int, rsvpDeadline:str, status:str, visibility:str, createdBy:str, createdAt:str, updatedAt:str, attendeeCount:int, rsvpStats:obj{attending:int, notAttending:int, maybe:int, pending:int}}], page:int, limit:int, totalPages:int, totalResults:int}
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET "/events?status=published&limit=10" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_200: {"results":[{"id":"1","title":"Annual Company Conference 2025","description":"Join us for our biggest company conference","startDate":"2025-11-15T09:00:00Z","endDate":"2025-11-15T17:00:00Z","location":{"type":"physical","address":"123 Conference Center, Downtown City, NY 10001"},"capacity":200,"rsvpDeadline":"2025-11-10T23:59:59Z","status":"published","visibility":"public","createdBy":"1","createdAt":"2025-10-01T10:00:00Z","updatedAt":"2025-10-20T14:30:00Z","attendeeCount":85,"rsvpStats":{"attending":75,"notAttending":8,"maybe":12,"pending":25}}],"page":1,"limit":10,"totalPages":1,"totalResults":1}

---

EP: GET /events/recent
DESC: Get recent events for dashboard display.
IN: headers:{Authorization:str!}
OUT: 200:arr[obj{id:str, title:str, startDate:str, attendeeCount:int, status:str, rsvpStats:obj{attending:int, notAttending:int, maybe:int, pending:int}}]
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET /events/recent -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_200: [{"id":"1","title":"Annual Company Conference 2025","startDate":"2025-11-15T09:00:00Z","attendeeCount":85,"status":"published","rsvpStats":{"attending":75,"notAttending":8,"maybe":12,"pending":25}}]

---

EP: GET /events/:id
DESC: Get a specific event by ID.
IN: headers:{Authorization:str!}, params:{id:str!}
OUT: 200:{id:str, title:str, description:str, startDate:str, endDate:str, location:obj{type:str, address:str, virtualLink:str}, capacity:int, rsvpDeadline:str, status:str, visibility:str, createdBy:str, createdAt:str, updatedAt:str, attendeeCount:int, rsvpStats:obj{attending:int, notAttending:int, maybe:int, pending:int}}
ERR: {"401":"Unauthorized", "404":"Event not found", "500":"Internal server error"}
EX_REQ: curl -X GET /events/1 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_200: {"id":"1","title":"Annual Company Conference 2025","description":"Join us for our biggest company conference","startDate":"2025-11-15T09:00:00Z","endDate":"2025-11-15T17:00:00Z","location":{"type":"physical","address":"123 Conference Center, Downtown City, NY 10001"},"capacity":200,"rsvpDeadline":"2025-11-10T23:59:59Z","status":"published","visibility":"public","createdBy":"1","createdAt":"2025-10-01T10:00:00Z","updatedAt":"2025-10-20T14:30:00Z","attendeeCount":85,"rsvpStats":{"attending":75,"notAttending":8,"maybe":12,"pending":25}}

---

EP: POST /events
DESC: Create a new event.
IN: headers:{Authorization:str!}, body:{title:str!, description:str!, startDate:str!, endDate:str, location:obj{type:str!, address:str, virtualLink:str}!, capacity:int, rsvpDeadline:str, visibility:str!}
OUT: 201:{id:str, title:str, description:str, startDate:str, endDate:str, location:obj{type:str, address:str, virtualLink:str}, capacity:int, rsvpDeadline:str, status:str, visibility:str, createdBy:str, createdAt:str, updatedAt:str, attendeeCount:int, rsvpStats:obj{attending:int, notAttending:int, maybe:int, pending:int}}
ERR: {"400":"Invalid input, missing required fields", "401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /events -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -H "Content-Type: application/json" -d '{"title":"New Event","description":"Event description","startDate":"2025-12-01T10:00:00Z","location":{"type":"physical","address":"Event Hall"},"visibility":"public"}'
EX_RES_201: {"id":"new-event-id","title":"New Event","description":"Event description","startDate":"2025-12-01T10:00:00Z","location":{"type":"physical","address":"Event Hall"},"status":"draft","visibility":"public","createdBy":"1","createdAt":"2025-10-25T10:00:00Z","updatedAt":"2025-10-25T10:00:00Z","attendeeCount":0,"rsvpStats":{"attending":0,"notAttending":0,"maybe":0,"pending":0}}

---

EP: PUT /events/:id
DESC: Update an existing event.
IN: headers:{Authorization:str!}, params:{id:str!}, body:{title:str, description:str, startDate:str, endDate:str, location:obj{type:str, address:str, virtualLink:str}, capacity:int, rsvpDeadline:str, visibility:str}
OUT: 200:{id:str, title:str, description:str, startDate:str, endDate:str, location:obj{type:str, address:str, virtualLink:str}, capacity:int, rsvpDeadline:str, status:str, visibility:str, createdBy:str, createdAt:str, updatedAt:str, attendeeCount:int, rsvpStats:obj{attending:int, notAttending:int, maybe:int, pending:int}}
ERR: {"400":"Invalid input", "401":"Unauthorized", "403":"Forbidden", "404":"Event not found", "500":"Internal server error"}
EX_REQ: curl -X PUT /events/1 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -H "Content-Type: application/json" -d '{"title":"Updated Event Title"}'
EX_RES_200: {"id":"1","title":"Updated Event Title","description":"Join us for our biggest company conference","startDate":"2025-11-15T09:00:00Z","endDate":"2025-11-15T17:00:00Z","location":{"type":"physical","address":"123 Conference Center, Downtown City, NY 10001"},"capacity":200,"rsvpDeadline":"2025-11-10T23:59:59Z","status":"published","visibility":"public","createdBy":"1","createdAt":"2025-10-01T10:00:00Z","updatedAt":"2025-10-25T10:00:00Z","attendeeCount":85,"rsvpStats":{"attending":75,"notAttending":8,"maybe":12,"pending":25}}

---

EP: DELETE /events/:id
DESC: Delete an event.
IN: headers:{Authorization:str!}, params:{id:str!}
OUT: 204:{}
ERR: {"401":"Unauthorized", "403":"Forbidden", "404":"Event not found", "500":"Internal server error"}
EX_REQ: curl -X DELETE /events/1 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_204: {}

---

### Attendee APIs

EP: GET /events/:eventId/attendees
DESC: Get list of attendees for a specific event.
IN: headers:{Authorization:str!}, params:{eventId:str!}
OUT: 200:arr[obj{id:str, eventId:str, name:str, email:str, rsvpStatus:str, dietaryRequirements:str, registrationDate:str, guestInfo:obj{phone:str, company:str}}]
ERR: {"401":"Unauthorized", "404":"Event not found", "500":"Internal server error"}
EX_REQ: curl -X GET /events/1/attendees -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_200: [{"id":"1","eventId":"1","name":"Alice Johnson","email":"alice@example.com","rsvpStatus":"attending","registrationDate":"2025-10-20T10:00:00Z","guestInfo":{"phone":"+1-555-0123","company":"TechCorp Inc."}}]

---

EP: POST /rsvp
DESC: Create RSVP for an event.
IN: body:{eventId:str!, name:str!, email:str!, rsvpStatus:str!, dietaryRequirements:str, guestInfo:obj{phone:str, company:str}}
OUT: 201:{id:str, eventId:str, name:str, email:str, rsvpStatus:str, dietaryRequirements:str, registrationDate:str, guestInfo:obj{phone:str, company:str}}
ERR: {"400":"Invalid input, missing required fields", "404":"Event not found", "409":"RSVP already exists", "422":"Event capacity reached", "500":"Internal server error"}
EX_REQ: curl -X POST /rsvp -H "Content-Type: application/json" -d '{"eventId":"1","name":"John Doe","email":"john@example.com","rsvpStatus":"attending"}'
EX_RES_201: {"id":"new-attendee-id","eventId":"1","name":"John Doe","email":"john@example.com","rsvpStatus":"attending","registrationDate":"2025-10-25T10:00:00Z"}

---

EP: PUT /events/:eventId/attendees/:attendeeId/status
DESC: Update attendee RSVP status.
IN: headers:{Authorization:str!}, params:{eventId:str!, attendeeId:str!}, body:{status:str!}
OUT: 200:{id:str, eventId:str, name:str, email:str, rsvpStatus:str, dietaryRequirements:str, registrationDate:str, guestInfo:obj{phone:str, company:str}}
ERR: {"400":"Invalid status", "401":"Unauthorized", "404":"Attendee not found", "500":"Internal server error"}
EX_REQ: curl -X PUT /events/1/attendees/1/status -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -H "Content-Type: application/json" -d '{"status":"notAttending"}'
EX_RES_200: {"id":"1","eventId":"1","name":"Alice Johnson","email":"alice@example.com","rsvpStatus":"notAttending","registrationDate":"2025-10-20T10:00:00Z","guestInfo":{"phone":"+1-555-0123","company":"TechCorp Inc."}}

---

### Message APIs

EP: GET /events/:eventId/messages
DESC: Get messages for a specific event.
IN: headers:{Authorization:str!}, params:{eventId:str!}
OUT: 200:arr[obj{id:str, eventId:str, subject:str, content:str, recipientCount:int, deliveryStatus:str, scheduledDate:str, sentDate:str, createdBy:str, createdAt:str, recipientFilter:obj{rsvpStatus:arr[str], registrationDateRange:obj{start:str, end:str}, searchQuery:str}}]
ERR: {"401":"Unauthorized", "404":"Event not found", "500":"Internal server error"}
EX_REQ: curl -X GET /events/1/messages -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_200: [{"id":"1","eventId":"1","subject":"Welcome to Annual Company Conference 2025","content":"Thank you for registering...","recipientCount":75,"deliveryStatus":"delivered","sentDate":"2025-10-23T10:00:00Z","createdBy":"1","createdAt":"2025-10-23T09:30:00Z","recipientFilter":{"rsvpStatus":["attending"]}}]

---

EP: POST /events/:eventId/messages
DESC: Create and send a message to event attendees.
IN: headers:{Authorization:str!}, params:{eventId:str!}, body:{subject:str!, content:str!, recipientFilter:obj{rsvpStatus:arr[str], registrationDateRange:obj{start:str, end:str}, searchQuery:str}!, scheduledDate:str}
OUT: 201:{id:str, eventId:str, subject:str, content:str, recipientCount:int, deliveryStatus:str, scheduledDate:str, sentDate:str, createdBy:str, createdAt:str, recipientFilter:obj{rsvpStatus:arr[str], registrationDateRange:obj{start:str, end:str}, searchQuery:str}}
ERR: {"400":"Invalid input, missing required fields", "401":"Unauthorized", "404":"Event not found", "500":"Internal server error"}
EX_REQ: curl -X POST /events/1/messages -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -H "Content-Type: application/json" -d '{"subject":"Event Reminder","content":"Don't forget about the event tomorrow!","recipientFilter":{"rsvpStatus":["attending","maybe"]}}'
EX_RES_201: {"id":"new-message-id","eventId":"1","subject":"Event Reminder","content":"Don't forget about the event tomorrow!","recipientCount":87,"deliveryStatus":"sent","sentDate":"2025-10-25T10:00:00Z","createdBy":"1","createdAt":"2025-10-25T10:00:00Z","recipientFilter":{"rsvpStatus":["attending","maybe"]}}

---

EP: POST /messages/schedule
DESC: Schedule a message to be sent later.
IN: headers:{Authorization:str!}, body:{eventId:str!, subject:str!, content:str!, recipientFilter:obj{rsvpStatus:arr[str], registrationDateRange:obj{start:str, end:str}, searchQuery:str}!, scheduledDate:str!}
OUT: 201:{id:str, eventId:str, subject:str, content:str, recipientCount:int, deliveryStatus:str, scheduledDate:str, createdBy:str, createdAt:str, recipientFilter:obj{rsvpStatus:arr[str], registrationDateRange:obj{start:str, end:str}, searchQuery:str}}
ERR: {"400":"Invalid input, missing required fields", "401":"Unauthorized", "404":"Event not found", "422":"Scheduled date must be in the future", "500":"Internal server error"}
EX_REQ: curl -X POST /messages/schedule -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -H "Content-Type: application/json" -d '{"eventId":"1","subject":"Final Reminder","content":"Event starts in 1 hour!","recipientFilter":{"rsvpStatus":["attending"]},"scheduledDate":"2025-11-15T08:00:00Z"}'
EX_RES_201: {"id":"scheduled-message-id","eventId":"1","subject":"Final Reminder","content":"Event starts in 1 hour!","recipientCount":75,"deliveryStatus":"scheduled","scheduledDate":"2025-11-15T08:00:00Z","createdBy":"1","createdAt":"2025-10-25T10:00:00Z","recipientFilter":{"rsvpStatus":["attending"]}}

---

EP: GET /messages/:messageId/delivery-status
DESC: Get delivery status details for a message.
IN: headers:{Authorization:str!}, params:{messageId:str!}
OUT: 200:{messageId:str, totalRecipients:int, delivered:int, failed:int, pending:int, details:arr[obj{recipientEmail:str, status:str, timestamp:str, error:str}]}
ERR: {"401":"Unauthorized", "404":"Message not found", "500":"Internal server error"}
EX_REQ: curl -X GET /messages/1/delivery-status -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_200: {"messageId":"1","totalRecipients":50,"delivered":45,"failed":2,"pending":3,"details":[{"recipientEmail":"alice@example.com","status":"delivered","timestamp":"2025-10-25T09:00:00Z"},{"recipientEmail":"bob@example.com","status":"failed","timestamp":"2025-10-25T09:01:00Z","error":"Invalid email address"}]}

---

### Message Template APIs

EP: GET /message-templates
DESC: Get list of message templates.
IN: headers:{Authorization:str!}
OUT: 200:arr[obj{id:str, name:str, subject:str, content:str, category:str, createdAt:str, updatedAt:str}]
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET /message-templates -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_200: [{"id":"1","name":"RSVP Confirmation","subject":"Your RSVP has been confirmed","content":"Thank you for confirming your attendance...","category":"confirmation","createdAt":"2025-10-01T10:00:00Z","updatedAt":"2025-10-01T10:00:00Z"}]

---

EP: POST /message-templates
DESC: Create a new message template.
IN: headers:{Authorization:str!}, body:{name:str!, subject:str!, content:str!, category:str!}
OUT: 201:{id:str, name:str, subject:str, content:str, category:str, createdAt:str, updatedAt:str}
ERR: {"400":"Invalid input, missing required fields", "401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /message-templates -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -H "Content-Type: application/json" -d '{"name":"Welcome Template","subject":"Welcome to {{event.title}}","content":"Thank you for joining us!","category":"confirmation"}'
EX_RES_201: {"id":"new-template-id","name":"Welcome Template","subject":"Welcome to {{event.title}}","content":"Thank you for joining us!","category":"confirmation","createdAt":"2025-10-25T10:00:00Z","updatedAt":"2025-10-25T10:00:00Z"}

---

EP: PUT /message-templates/:id
DESC: Update an existing message template.
IN: headers:{Authorization:str!}, params:{id:str!}, body:{name:str, subject:str, content:str, category:str}
OUT: 200:{id:str, name:str, subject:str, content:str, category:str, createdAt:str, updatedAt:str}
ERR: {"400":"Invalid input", "401":"Unauthorized", "404":"Template not found", "500":"Internal server error"}
EX_REQ: curl -X PUT /message-templates/1 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -H "Content-Type: application/json" -d '{"name":"Updated Template Name"}'
EX_RES_200: {"id":"1","name":"Updated Template Name","subject":"Your RSVP has been confirmed","content":"Thank you for confirming your attendance...","category":"confirmation","createdAt":"2025-10-01T10:00:00Z","updatedAt":"2025-10-25T10:00:00Z"}

---

EP: DELETE /message-templates/:id
DESC: Delete a message template.
IN: headers:{Authorization:str!}, params:{id:str!}
OUT: 204:{}
ERR: {"401":"Unauthorized", "404":"Template not found", "500":"Internal server error"}
EX_REQ: curl -X DELETE /message-templates/1 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
EX_RES_204: {}