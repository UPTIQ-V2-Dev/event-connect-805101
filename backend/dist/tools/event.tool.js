import { eventService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
// Shared schemas
const locationSchema = z.object({
    type: z.string(),
    address: z.string().optional(),
    virtualLink: z.string().optional()
});
const rsvpStatsSchema = z.object({
    attending: z.number(),
    notAttending: z.number(),
    maybe: z.number(),
    pending: z.number()
});
const eventSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    locationType: z.string(),
    address: z.string().nullable(),
    virtualLink: z.string().nullable(),
    capacity: z.number().nullable(),
    rsvpDeadline: z.string().nullable(),
    status: z.string(),
    visibility: z.string(),
    createdBy: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    attendeeCount: z.number(),
    rsvpStats: rsvpStatsSchema,
    location: locationSchema
});
const createEventTool = {
    id: 'event_create',
    name: 'Create Event',
    description: 'Create a new event',
    inputSchema: z.object({
        title: z.string().min(1).max(255),
        description: z.string().min(1),
        startDate: z.string(),
        endDate: z.string().optional(),
        locationType: z.enum(['physical', 'virtual']),
        address: z.string().optional(),
        virtualLink: z.string().url().optional(),
        capacity: z.number().int().min(1).optional(),
        rsvpDeadline: z.string().optional(),
        visibility: z.enum(['public', 'private']),
        createdBy: z.number().int()
    }),
    outputSchema: eventSchema,
    fn: async (inputs) => {
        const eventData = {
            title: inputs.title,
            description: inputs.description,
            startDate: inputs.startDate,
            endDate: inputs.endDate,
            locationType: inputs.locationType,
            address: inputs.address,
            virtualLink: inputs.virtualLink,
            capacity: inputs.capacity,
            rsvpDeadline: inputs.rsvpDeadline,
            visibility: inputs.visibility
        };
        const event = await eventService.createEvent(eventData, inputs.createdBy);
        return event;
    }
};
const getEventsTool = {
    id: 'event_get_all',
    name: 'Get All Events',
    description: 'Get all events with optional filters and pagination',
    inputSchema: z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        visibility: z.string().optional(),
        dateStart: z.string().optional(),
        dateEnd: z.string().optional(),
        createdBy: z.number().int().optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        sortBy: z.string().optional(),
        sortType: z.enum(['asc', 'desc']).optional()
    }),
    outputSchema: z.object({
        results: z.array(eventSchema),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        totalResults: z.number()
    }),
    fn: async (inputs) => {
        const filter = pick(inputs, ['status', 'search', 'visibility', 'dateStart', 'dateEnd', 'createdBy']);
        const options = pick(inputs, ['page', 'limit', 'sortBy', 'sortType']);
        const result = await eventService.queryEvents(filter, options);
        return result;
    }
};
const getRecentEventsTool = {
    id: 'event_get_recent',
    name: 'Get Recent Events',
    description: 'Get recent events for dashboard display',
    inputSchema: z.object({
        createdBy: z.number().int().optional(),
        limit: z.number().int().min(1).max(50).optional()
    }),
    outputSchema: z.object({
        events: z.array(z.object({
            id: z.string(),
            title: z.string(),
            startDate: z.string(),
            attendeeCount: z.number(),
            status: z.string(),
            rsvpStats: rsvpStatsSchema
        }))
    }),
    fn: async (inputs) => {
        const events = await eventService.getRecentEvents(inputs.createdBy, inputs.limit);
        return { events };
    }
};
const getEventByIdTool = {
    id: 'event_get_by_id',
    name: 'Get Event By ID',
    description: 'Get a specific event by ID',
    inputSchema: z.object({
        eventId: z.string()
    }),
    outputSchema: eventSchema,
    fn: async (inputs) => {
        const event = await eventService.getEventById(inputs.eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        return event;
    }
};
const updateEventTool = {
    id: 'event_update',
    name: 'Update Event',
    description: 'Update an existing event by ID',
    inputSchema: z.object({
        eventId: z.string(),
        userId: z.number().int(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().min(1).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        locationType: z.enum(['physical', 'virtual']).optional(),
        address: z.string().optional(),
        virtualLink: z.string().url().optional(),
        capacity: z.number().int().min(1).optional(),
        rsvpDeadline: z.string().optional(),
        visibility: z.enum(['public', 'private']).optional(),
        status: z.enum(['draft', 'published', 'cancelled']).optional()
    }),
    outputSchema: eventSchema,
    fn: async (inputs) => {
        const updateData = pick(inputs, [
            'title',
            'description',
            'startDate',
            'endDate',
            'locationType',
            'address',
            'virtualLink',
            'capacity',
            'rsvpDeadline',
            'visibility',
            'status'
        ]);
        const event = await eventService.updateEventById(inputs.eventId, updateData, inputs.userId);
        return event;
    }
};
const deleteEventTool = {
    id: 'event_delete',
    name: 'Delete Event',
    description: 'Delete an event by ID',
    inputSchema: z.object({
        eventId: z.string(),
        userId: z.number().int()
    }),
    outputSchema: z.object({
        success: z.boolean()
    }),
    fn: async (inputs) => {
        await eventService.deleteEventById(inputs.eventId, inputs.userId);
        return { success: true };
    }
};
export const eventTools = [
    createEventTool,
    getEventsTool,
    getRecentEventsTool,
    getEventByIdTool,
    updateEventTool,
    deleteEventTool
];
