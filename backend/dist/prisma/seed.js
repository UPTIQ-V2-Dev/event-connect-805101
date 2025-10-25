import { PrismaClient, Role } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin',
            password: adminPassword,
            role: Role.ADMIN,
            isEmailVerified: true
        }
    });
    console.log('✅ Created admin user:', admin.email);
    // Create regular user for testing events
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            name: 'John Doe',
            password: userPassword,
            role: Role.USER,
            isEmailVerified: true
        }
    });
    console.log('✅ Created regular user:', user.email);
    // Create sample events
    const event1 = await prisma.event.upsert({
        where: { id: 'sample-event-1' },
        update: {},
        create: {
            id: 'sample-event-1',
            title: 'Annual Company Conference 2025',
            description: 'Join us for our biggest company conference of the year! Network with colleagues, learn about new technologies, and celebrate our achievements.',
            startDate: new Date('2025-11-15T09:00:00Z'),
            endDate: new Date('2025-11-15T17:00:00Z'),
            locationType: 'physical',
            address: '123 Conference Center, Downtown City, NY 10001',
            capacity: 200,
            rsvpDeadline: new Date('2025-11-10T23:59:59Z'),
            status: 'published',
            visibility: 'public',
            createdBy: admin.id
        }
    });
    const event2 = await prisma.event.upsert({
        where: { id: 'sample-event-2' },
        update: {},
        create: {
            id: 'sample-event-2',
            title: 'Virtual Team Building Workshop',
            description: 'A fun virtual team building session with games and activities.',
            startDate: new Date('2025-12-01T14:00:00Z'),
            endDate: new Date('2025-12-01T16:00:00Z'),
            locationType: 'virtual',
            virtualLink: 'https://zoom.us/j/123456789',
            capacity: 50,
            rsvpDeadline: new Date('2025-11-28T23:59:59Z'),
            status: 'published',
            visibility: 'public',
            createdBy: user.id
        }
    });
    console.log('✅ Created sample events:', event1.title, event2.title);
    // Create sample attendees
    await prisma.attendee.upsert({
        where: {
            eventId_email: {
                eventId: event1.id,
                email: 'attendee1@example.com'
            }
        },
        update: {},
        create: {
            eventId: event1.id,
            name: 'Alice Johnson',
            email: 'attendee1@example.com',
            rsvpStatus: 'attending',
            phone: '+1-555-0123',
            company: 'TechCorp Inc.',
            registeredById: admin.id
        }
    });
    await prisma.attendee.upsert({
        where: {
            eventId_email: {
                eventId: event1.id,
                email: 'attendee2@example.com'
            }
        },
        update: {},
        create: {
            eventId: event1.id,
            name: 'Bob Smith',
            email: 'attendee2@example.com',
            rsvpStatus: 'maybe',
            phone: '+1-555-0124',
            company: 'DevStudio LLC'
        }
    });
    console.log('✅ Created sample attendees');
    // Create sample messages
    const message1 = await prisma.message.upsert({
        where: { id: 'sample-message-1' },
        update: {},
        create: {
            id: 'sample-message-1',
            eventId: event1.id,
            subject: 'Welcome to Annual Company Conference 2025',
            content: 'Thank you for registering for our annual conference! We are excited to have you join us. Please make sure to arrive by 8:30 AM for registration and networking breakfast.',
            recipientCount: 2,
            deliveryStatus: 'delivered',
            sentDate: new Date('2025-10-23T10:00:00Z'),
            createdBy: admin.id,
            rsvpStatusFilter: 'attending,maybe'
        }
    });
    const message2 = await prisma.message.upsert({
        where: { id: 'sample-message-2' },
        update: {},
        create: {
            id: 'sample-message-2',
            eventId: event1.id,
            subject: 'Final Reminder - Conference Tomorrow',
            content: "Just a friendly reminder that the Annual Company Conference is tomorrow! Don't forget to bring your ID badge and laptop. Looking forward to seeing everyone there!",
            recipientCount: 1,
            deliveryStatus: 'scheduled',
            scheduledDate: new Date('2025-11-14T08:00:00Z'),
            createdBy: admin.id,
            rsvpStatusFilter: 'attending',
            searchQuery: null,
            dateRangeStart: null,
            dateRangeEnd: null
        }
    });
    console.log('✅ Created sample messages:', message1.subject, message2.subject);
    // Create sample message templates
    const template1 = await prisma.messageTemplate.upsert({
        where: { id: 'template-rsvp-confirmation' },
        update: {},
        create: {
            id: 'template-rsvp-confirmation',
            name: 'RSVP Confirmation',
            subject: 'Your RSVP for {{event.title}} has been confirmed',
            content: 'Dear {{attendee.name}},\n\nThank you for confirming your attendance to {{event.title}}. We are excited to have you join us!\n\nEvent Details:\n- Title: {{event.title}}\n- Date: {{event.startDate}}\n- Location: {{event.location}}\n\nWe look forward to seeing you there!\n\nBest regards,\nEvent Team',
            category: 'confirmation'
        }
    });
    const template2 = await prisma.messageTemplate.upsert({
        where: { id: 'template-event-reminder' },
        update: {},
        create: {
            id: 'template-event-reminder',
            name: 'Event Reminder',
            subject: 'Reminder: {{event.title}} is coming up!',
            content: "Dear {{attendee.name}},\n\nThis is a friendly reminder that {{event.title}} is scheduled for {{event.startDate}}.\n\nDon't forget to:\n- Mark your calendar\n- Prepare any materials needed\n- Arrive on time\n\nWe're looking forward to seeing you there!\n\nBest regards,\nEvent Team",
            category: 'reminder'
        }
    });
    const template3 = await prisma.messageTemplate.upsert({
        where: { id: 'template-welcome-message' },
        update: {},
        create: {
            id: 'template-welcome-message',
            name: 'Welcome Message',
            subject: 'Welcome to {{event.title}}!',
            content: 'Dear {{attendee.name}},\n\nWelcome to {{event.title}}! We are thrilled to have you as part of this event.\n\nHere are some important details:\n- Event starts at {{event.startDate}}\n- Location: {{event.location}}\n- Please arrive 15 minutes early for check-in\n\nIf you have any questions, feel free to reach out to us.\n\nBest regards,\nEvent Team',
            category: 'welcome'
        }
    });
    const template4 = await prisma.messageTemplate.upsert({
        where: { id: 'template-event-update' },
        update: {},
        create: {
            id: 'template-event-update',
            name: 'Event Update',
            subject: 'Important Update for {{event.title}}',
            content: "Dear {{attendee.name}},\n\nWe have an important update regarding {{event.title}}.\n\nPlease note the following changes:\n[Insert update details here]\n\nWe apologize for any inconvenience this may cause. If you have any questions, please don't hesitate to contact us.\n\nThank you for your understanding.\n\nBest regards,\nEvent Team",
            category: 'update'
        }
    });
    console.log('✅ Created sample message templates:', template1.name, template2.name, template3.name, template4.name);
}
main()
    .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
