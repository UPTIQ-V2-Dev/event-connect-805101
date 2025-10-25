import { messageService } from "../services/index.js";
import { z } from 'zod';
const recipientFilterSchema = z.object({
    rsvpStatus: z.array(z.enum(['attending', 'notAttending', 'maybe', 'pending'])).optional(),
    registrationDateRange: z
        .object({
        start: z.string().optional(),
        end: z.string().optional()
    })
        .optional(),
    searchQuery: z.string().optional()
});
const messageSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    subject: z.string(),
    content: z.string(),
    recipientCount: z.number(),
    deliveryStatus: z.string(),
    scheduledDate: z.string().optional(),
    sentDate: z.string().optional(),
    createdBy: z.string(),
    createdAt: z.string(),
    recipientFilter: recipientFilterSchema
});
const createMessageTool = {
    id: 'message_create',
    name: 'Create Message',
    description: 'Create and send a message to event attendees',
    inputSchema: z.object({
        eventId: z.string().min(1),
        subject: z.string().min(1).max(255),
        content: z.string().min(1),
        recipientFilter: recipientFilterSchema,
        scheduledDate: z.string().optional(),
        createdBy: z.number().int()
    }),
    outputSchema: messageSchema,
    fn: async (inputs) => {
        const message = await messageService.createMessage(inputs);
        return messageService.transformMessageToResponse(message);
    }
};
const scheduleMessageTool = {
    id: 'message_schedule',
    name: 'Schedule Message',
    description: 'Schedule a message to be sent later to event attendees',
    inputSchema: z.object({
        eventId: z.string().min(1),
        subject: z.string().min(1).max(255),
        content: z.string().min(1),
        recipientFilter: recipientFilterSchema,
        scheduledDate: z.string().min(1),
        createdBy: z.number().int()
    }),
    outputSchema: messageSchema,
    fn: async (inputs) => {
        const message = await messageService.scheduleMessage(inputs);
        return messageService.transformMessageToResponse(message);
    }
};
const getEventMessagesTool = {
    id: 'message_get_by_event',
    name: 'Get Event Messages',
    description: 'Get all messages for a specific event',
    inputSchema: z.object({
        eventId: z.string().min(1),
        userId: z.number().int()
    }),
    outputSchema: z.object({
        messages: z.array(messageSchema)
    }),
    fn: async (inputs) => {
        const messages = await messageService.getEventMessages(inputs.eventId, inputs.userId);
        const transformedMessages = messages.map(message => messageService.transformMessageToResponse(message));
        return { messages: transformedMessages };
    }
};
const getMessageDeliveryStatusTool = {
    id: 'message_get_delivery_status',
    name: 'Get Message Delivery Status',
    description: 'Get detailed delivery status information for a message',
    inputSchema: z.object({
        messageId: z.string().min(1),
        userId: z.number().int()
    }),
    outputSchema: z.object({
        messageId: z.string(),
        totalRecipients: z.number(),
        delivered: z.number(),
        failed: z.number(),
        pending: z.number(),
        details: z.array(z.object({
            recipientEmail: z.string(),
            status: z.string(),
            timestamp: z.string(),
            error: z.string().optional()
        }))
    }),
    fn: async (inputs) => {
        const deliveryStatus = await messageService.getMessageDeliveryStatus(inputs.messageId, inputs.userId);
        return deliveryStatus;
    }
};
const calculateRecipientCountTool = {
    id: 'message_calculate_recipients',
    name: 'Calculate Recipient Count',
    description: 'Calculate how many attendees match the recipient filter criteria',
    inputSchema: z.object({
        eventId: z.string().min(1),
        recipientFilter: recipientFilterSchema
    }),
    outputSchema: z.object({
        count: z.number()
    }),
    fn: async (inputs) => {
        const count = await messageService.calculateRecipientCount(inputs.eventId, inputs.recipientFilter);
        return { count };
    }
};
export const messageTools = [
    createMessageTool,
    scheduleMessageTool,
    getEventMessagesTool,
    getMessageDeliveryStatusTool,
    calculateRecipientCountTool
];
