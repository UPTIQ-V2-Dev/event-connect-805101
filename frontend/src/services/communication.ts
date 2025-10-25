import { api } from '@/lib/api';
import { mockApiDelay } from '@/lib/utils';
import type {
    Message,
    CreateMessageRequest,
    MessageTemplate,
    CreateMessageTemplateRequest,
    DeliveryStatus
} from '@/types/communication';
import { mockMessages, mockMessageTemplates } from '@/data/mockData';

export const communicationService = {
    getMessages: async (eventId: string): Promise<Message[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getMessages ---', eventId);
            await mockApiDelay();
            return mockMessages.filter(message => message.eventId === eventId);
        }
        const response = await api.get(`/events/${eventId}/messages`);
        return response.data;
    },

    createMessage: async (messageData: CreateMessageRequest): Promise<Message> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: createMessage ---', messageData);
            await mockApiDelay();
            const newMessage: Message = {
                id: Math.random().toString(36).substr(2, 9),
                ...messageData,
                recipientCount: 50, // Mock recipient count
                deliveryStatus: messageData.scheduledDate ? 'scheduled' : 'sent',
                sentDate: messageData.scheduledDate ? undefined : new Date().toISOString(),
                createdBy: '1',
                createdAt: new Date().toISOString()
            };
            return newMessage;
        }
        const response = await api.post(`/events/${messageData.eventId}/messages`, messageData);
        return response.data;
    },

    scheduleMessage: async (messageData: CreateMessageRequest): Promise<Message> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: scheduleMessage ---', messageData);
            await mockApiDelay();
            const scheduledMessage: Message = {
                id: Math.random().toString(36).substr(2, 9),
                ...messageData,
                recipientCount: 50,
                deliveryStatus: 'scheduled',
                createdBy: '1',
                createdAt: new Date().toISOString()
            };
            return scheduledMessage;
        }
        const response = await api.post('/messages/schedule', messageData);
        return response.data;
    },

    getMessageTemplates: async (): Promise<MessageTemplate[]> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getMessageTemplates ---');
            await mockApiDelay();
            return mockMessageTemplates;
        }
        const response = await api.get('/message-templates');
        return response.data;
    },

    createMessageTemplate: async (templateData: CreateMessageTemplateRequest): Promise<MessageTemplate> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: createMessageTemplate ---', templateData);
            await mockApiDelay();
            const newTemplate: MessageTemplate = {
                id: Math.random().toString(36).substr(2, 9),
                ...templateData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            return newTemplate;
        }
        const response = await api.post('/message-templates', templateData);
        return response.data;
    },

    updateMessageTemplate: async (
        id: string,
        templateData: Partial<CreateMessageTemplateRequest>
    ): Promise<MessageTemplate> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: updateMessageTemplate ---', id, templateData);
            await mockApiDelay();
            const existingTemplate = mockMessageTemplates.find(t => t.id === id);
            if (!existingTemplate) {
                throw new Error('Template not found');
            }
            return {
                ...existingTemplate,
                ...templateData,
                updatedAt: new Date().toISOString()
            };
        }
        const response = await api.put(`/message-templates/${id}`, templateData);
        return response.data;
    },

    deleteMessageTemplate: async (id: string): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: deleteMessageTemplate ---', id);
            await mockApiDelay();
            return;
        }
        await api.delete(`/message-templates/${id}`);
    },

    getMessageDeliveryStatus: async (messageId: string): Promise<DeliveryStatus> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: getMessageDeliveryStatus ---', messageId);
            await mockApiDelay();
            return {
                messageId,
                totalRecipients: 50,
                delivered: 45,
                failed: 2,
                pending: 3,
                details: [
                    {
                        recipientEmail: 'alice@example.com',
                        status: 'delivered',
                        timestamp: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        recipientEmail: 'bob@example.com',
                        status: 'failed',
                        timestamp: new Date(Date.now() - 1800000).toISOString(),
                        error: 'Invalid email address'
                    },
                    {
                        recipientEmail: 'carol@example.com',
                        status: 'pending'
                    }
                ]
            };
        }
        const response = await api.get(`/messages/${messageId}/delivery-status`);
        return response.data;
    }
};
