import prisma from '../client.ts';
import { MessageTemplate, Prisma } from '../generated/prisma/index.js';
import ApiError from '../utils/ApiError.ts';
import httpStatus from 'http-status';

/**
 * Create a message template
 * @param {Object} templateBody
 * @returns {Promise<MessageTemplate>}
 */
const createMessageTemplate = async (
    name: string,
    subject: string,
    content: string,
    category: string
): Promise<MessageTemplate> => {
    return await prisma.messageTemplate.create({
        data: {
            name,
            subject,
            content,
            category
        }
    });
};

/**
 * Query for message templates
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMessageTemplates = async <Key extends keyof MessageTemplate>(
    filter: object,
    options: {
        limit?: number;
        page?: number;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
    },
    keys: Key[] = ['id', 'name', 'subject', 'content', 'category', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<MessageTemplate, Key>[]> => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy;
    const sortType = options.sortType ?? 'desc';
    const templates = await prisma.messageTemplate.findMany({
        where: filter,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortType } : { createdAt: 'desc' }
    });
    return templates as Pick<MessageTemplate, Key>[];
};

/**
 * Get message template by id
 * @param {string} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<MessageTemplate, Key> | null>}
 */
const getMessageTemplateById = async <Key extends keyof MessageTemplate>(
    id: string,
    keys: Key[] = ['id', 'name', 'subject', 'content', 'category', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<MessageTemplate, Key> | null> => {
    return (await prisma.messageTemplate.findUnique({
        where: { id },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    })) as Promise<Pick<MessageTemplate, Key> | null>;
};

/**
 * Update message template by id
 * @param {string} templateId
 * @param {Object} updateBody
 * @returns {Promise<MessageTemplate>}
 */
const updateMessageTemplateById = async <Key extends keyof MessageTemplate>(
    templateId: string,
    updateBody: Prisma.MessageTemplateUpdateInput,
    keys: Key[] = ['id', 'name', 'subject', 'content', 'category', 'createdAt', 'updatedAt'] as Key[]
): Promise<Pick<MessageTemplate, Key> | null> => {
    const template = await getMessageTemplateById(templateId, ['id', 'name']);
    if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Message template not found');
    }
    const updatedTemplate = await prisma.messageTemplate.update({
        where: { id: template.id },
        data: updateBody,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    });
    return updatedTemplate as Pick<MessageTemplate, Key> | null;
};

/**
 * Delete message template by id
 * @param {string} templateId
 * @returns {Promise<MessageTemplate>}
 */
const deleteMessageTemplateById = async (templateId: string): Promise<MessageTemplate> => {
    const template = await getMessageTemplateById(templateId);
    if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Message template not found');
    }
    await prisma.messageTemplate.delete({ where: { id: template.id } });
    return template;
};

export default {
    createMessageTemplate,
    queryMessageTemplates,
    getMessageTemplateById,
    updateMessageTemplateById,
    deleteMessageTemplateById
};
