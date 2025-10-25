import { messageTemplateService } from '../services/index.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const createMessageTemplate = catchAsyncWithAuth(async (req, res) => {
    const { name, subject, content, category } = req.body;
    const template = await messageTemplateService.createMessageTemplate(name, subject, content, category);
    res.status(httpStatus.CREATED).send(template);
});

const getMessageTemplates = catchAsyncWithAuth(async (req, res) => {
    let filter = pick(req.validatedQuery, ['name', 'category']);
    const options = pick(req.validatedQuery, ['sortBy', 'sortType', 'limit', 'page']);

    // Handle search functionality
    if (req.validatedQuery.search) {
        filter = {
            ...filter,
            OR: [
                { name: { contains: req.validatedQuery.search, mode: 'insensitive' } },
                { subject: { contains: req.validatedQuery.search, mode: 'insensitive' } },
                { content: { contains: req.validatedQuery.search, mode: 'insensitive' } },
                { category: { contains: req.validatedQuery.search, mode: 'insensitive' } }
            ]
        };
    }

    const result = await messageTemplateService.queryMessageTemplates(filter, options);
    res.send(result);
});

const getMessageTemplate = catchAsyncWithAuth(async (req, res) => {
    const template = await messageTemplateService.getMessageTemplateById(req.params.id);
    if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Message template not found');
    }
    res.send(template);
});

const updateMessageTemplate = catchAsyncWithAuth(async (req, res) => {
    const template = await messageTemplateService.updateMessageTemplateById(req.params.id, req.body);
    res.send(template);
});

const deleteMessageTemplate = catchAsyncWithAuth(async (req, res) => {
    await messageTemplateService.deleteMessageTemplateById(req.params.id);
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    createMessageTemplate,
    getMessageTemplates,
    getMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate
};
