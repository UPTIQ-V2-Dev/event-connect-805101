import { messageTemplateService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
const messageTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    subject: z.string(),
    content: z.string(),
    category: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
});
const createMessageTemplateTool = {
    id: 'messagetemplate_create',
    name: 'Create Message Template',
    description: 'Create a new message template with placeholders support',
    inputSchema: z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        content: z.string().min(1),
        category: z.string().min(1)
    }),
    outputSchema: messageTemplateSchema,
    fn: async (inputs) => {
        const template = await messageTemplateService.createMessageTemplate(inputs.name, inputs.subject, inputs.content, inputs.category);
        return {
            ...template,
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString()
        };
    }
};
const getMessageTemplatesTool = {
    id: 'messagetemplate_get_all',
    name: 'Get All Message Templates',
    description: 'Get all message templates with optional filters, search, and pagination',
    inputSchema: z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.string().optional(),
        sortType: z.enum(['asc', 'desc']).optional(),
        limit: z.number().int().optional(),
        page: z.number().int().optional()
    }),
    outputSchema: z.object({
        templates: z.array(messageTemplateSchema)
    }),
    fn: async (inputs) => {
        let filter = pick(inputs, ['name', 'category']);
        const options = pick(inputs, ['sortBy', 'sortType', 'limit', 'page']);
        // Handle search functionality
        if (inputs.search) {
            filter = {
                ...filter,
                OR: [
                    { name: { contains: inputs.search, mode: 'insensitive' } },
                    { subject: { contains: inputs.search, mode: 'insensitive' } },
                    { content: { contains: inputs.search, mode: 'insensitive' } },
                    { category: { contains: inputs.search, mode: 'insensitive' } }
                ]
            };
        }
        const result = await messageTemplateService.queryMessageTemplates(filter, options);
        return {
            templates: result.map(template => ({
                ...template,
                createdAt: template.createdAt.toISOString(),
                updatedAt: template.updatedAt.toISOString()
            }))
        };
    }
};
const getMessageTemplateTool = {
    id: 'messagetemplate_get_by_id',
    name: 'Get Message Template By ID',
    description: 'Get a single message template by its ID',
    inputSchema: z.object({
        templateId: z.string()
    }),
    outputSchema: messageTemplateSchema,
    fn: async (inputs) => {
        const template = await messageTemplateService.getMessageTemplateById(inputs.templateId);
        if (!template) {
            throw new Error('Message template not found');
        }
        return {
            ...template,
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString()
        };
    }
};
const updateMessageTemplateTool = {
    id: 'messagetemplate_update',
    name: 'Update Message Template',
    description: 'Update message template information by ID',
    inputSchema: z.object({
        templateId: z.string(),
        name: z.string().optional(),
        subject: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional()
    }),
    outputSchema: messageTemplateSchema,
    fn: async (inputs) => {
        const updateBody = pick(inputs, ['name', 'subject', 'content', 'category']);
        const template = await messageTemplateService.updateMessageTemplateById(inputs.templateId, updateBody);
        if (!template) {
            throw new Error('Message template not found');
        }
        return {
            ...template,
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString()
        };
    }
};
const deleteMessageTemplateTool = {
    id: 'messagetemplate_delete',
    name: 'Delete Message Template',
    description: 'Delete a message template by its ID',
    inputSchema: z.object({
        templateId: z.string()
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string()
    }),
    fn: async (inputs) => {
        await messageTemplateService.deleteMessageTemplateById(inputs.templateId);
        return {
            success: true,
            message: 'Message template deleted successfully'
        };
    }
};
export const messageTemplateTools = [
    createMessageTemplateTool,
    getMessageTemplatesTool,
    getMessageTemplateTool,
    updateMessageTemplateTool,
    deleteMessageTemplateTool
];
