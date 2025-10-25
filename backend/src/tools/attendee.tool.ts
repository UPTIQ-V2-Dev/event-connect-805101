import { attendeeService } from '../services/index.ts';
import { MCPTool } from '../types/mcp.ts';
import { z } from 'zod';

const guestInfoSchema = z.object({
    phone: z.string().optional(),
    company: z.string().optional()
});

const attendeeSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    name: z.string(),
    email: z.string(),
    rsvpStatus: z.string(),
    dietaryRequirements: z.string().nullable(),
    registrationDate: z.string(),
    guestInfo: guestInfoSchema
});

const createRsvpTool: MCPTool = {
    id: 'attendee_create_rsvp',
    name: 'Create RSVP',
    description: 'Create RSVP for an event (public endpoint, no auth required)',
    inputSchema: z.object({
        eventId: z.string().min(1),
        name: z.string().min(1),
        email: z.string().email(),
        rsvpStatus: z.enum(['attending', 'notAttending', 'maybe', 'pending']),
        dietaryRequirements: z.string().optional(),
        guestInfo: z
            .object({
                phone: z.string().optional(),
                company: z.string().optional()
            })
            .optional()
    }),
    outputSchema: attendeeSchema,
    fn: async inputs => {
        const result = await attendeeService.createRsvp(inputs);
        return {
            ...result,
            registrationDate: result.registrationDate.toISOString()
        };
    }
};

const getEventAttendeesTool: MCPTool = {
    id: 'attendee_get_by_event',
    name: 'Get Event Attendees',
    description: 'Get list of attendees for a specific event',
    inputSchema: z.object({
        eventId: z.string().min(1)
    }),
    outputSchema: z.object({
        attendees: z.array(attendeeSchema)
    }),
    fn: async inputs => {
        const result = await attendeeService.getEventAttendees(inputs.eventId);
        return {
            attendees: result.map(attendee => ({
                ...attendee,
                registrationDate: attendee.registrationDate.toISOString()
            }))
        };
    }
};

const updateAttendeeStatusTool: MCPTool = {
    id: 'attendee_update_status',
    name: 'Update Attendee Status',
    description: 'Update attendee RSVP status (requires user ID - only event creators can update)',
    inputSchema: z.object({
        eventId: z.string().min(1),
        attendeeId: z.string().min(1),
        status: z.enum(['attending', 'notAttending', 'maybe', 'pending']),
        userId: z.number().int()
    }),
    outputSchema: attendeeSchema,
    fn: async inputs => {
        const result = await attendeeService.updateAttendeeStatus(
            inputs.eventId,
            inputs.attendeeId,
            inputs.status,
            inputs.userId
        );
        return {
            ...result,
            registrationDate: result.registrationDate.toISOString()
        };
    }
};

const getAttendeeByIdTool: MCPTool = {
    id: 'attendee_get_by_id',
    name: 'Get Attendee By ID',
    description: 'Get a single attendee by their ID',
    inputSchema: z.object({
        attendeeId: z.string().min(1)
    }),
    outputSchema: z.object({
        attendee: attendeeSchema.nullable()
    }),
    fn: async inputs => {
        const result = await attendeeService.getAttendeeById(inputs.attendeeId);
        if (!result) return { attendee: null };

        return {
            attendee: {
                ...result,
                registrationDate: result.registrationDate.toISOString()
            }
        };
    }
};

const queryAttendeesTool: MCPTool = {
    id: 'attendee_query',
    name: 'Query Attendees',
    description: 'Query attendees with optional filters and pagination',
    inputSchema: z.object({
        eventId: z.string().optional(),
        rsvpStatus: z.enum(['attending', 'notAttending', 'maybe', 'pending']).optional(),
        email: z.string().optional(),
        page: z.number().int().optional(),
        limit: z.number().int().optional(),
        sortBy: z.string().optional()
    }),
    outputSchema: z.object({
        attendees: z.array(attendeeSchema)
    }),
    fn: async inputs => {
        const filter = {
            eventId: inputs.eventId,
            rsvpStatus: inputs.rsvpStatus,
            email: inputs.email
        };

        const options = {
            page: inputs.page,
            limit: inputs.limit,
            sortBy: inputs.sortBy
        };

        const result = await attendeeService.queryAttendees(filter, options);
        return {
            attendees: result.map(attendee => ({
                ...attendee,
                registrationDate: attendee.registrationDate.toISOString()
            }))
        };
    }
};

const deleteAttendeeTool: MCPTool = {
    id: 'attendee_delete',
    name: 'Delete Attendee',
    description: 'Delete an attendee by their ID',
    inputSchema: z.object({
        attendeeId: z.string().min(1)
    }),
    outputSchema: z.object({
        success: z.boolean(),
        deletedAttendee: attendeeSchema
    }),
    fn: async inputs => {
        const result = await attendeeService.deleteAttendeeById(inputs.attendeeId);
        return {
            success: true,
            deletedAttendee: {
                ...result,
                registrationDate: result.registrationDate.toISOString()
            }
        };
    }
};

export const attendeeTools: MCPTool[] = [
    createRsvpTool,
    getEventAttendeesTool,
    updateAttendeeStatusTool,
    getAttendeeByIdTool,
    queryAttendeesTool,
    deleteAttendeeTool
];
