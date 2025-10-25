import prisma from "../client.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
/**
 * Create a message template
 * @param {Object} templateBody
 * @returns {Promise<MessageTemplate>}
 */
const createMessageTemplate = async (name, subject, content, category) => {
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
const queryMessageTemplates = async (filter, options, keys = ['id', 'name', 'subject', 'content', 'category', 'createdAt', 'updatedAt']) => {
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
    return templates;
};
/**
 * Get message template by id
 * @param {string} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<MessageTemplate, Key> | null>}
 */
const getMessageTemplateById = async (id, keys = ['id', 'name', 'subject', 'content', 'category', 'createdAt', 'updatedAt']) => {
    return (await prisma.messageTemplate.findUnique({
        where: { id },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }));
};
/**
 * Update message template by id
 * @param {string} templateId
 * @param {Object} updateBody
 * @returns {Promise<MessageTemplate>}
 */
const updateMessageTemplateById = async (templateId, updateBody, keys = ['id', 'name', 'subject', 'content', 'category', 'createdAt', 'updatedAt']) => {
    const template = await getMessageTemplateById(templateId, ['id', 'name']);
    if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Message template not found');
    }
    const updatedTemplate = await prisma.messageTemplate.update({
        where: { id: template.id },
        data: updateBody,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    });
    return updatedTemplate;
};
/**
 * Delete message template by id
 * @param {string} templateId
 * @returns {Promise<MessageTemplate>}
 */
const deleteMessageTemplateById = async (templateId) => {
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
