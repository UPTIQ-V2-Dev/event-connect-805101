import Joi from 'joi';

const createMessageTemplate = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        subject: Joi.string().required(),
        content: Joi.string().required(),
        category: Joi.string().required()
    })
};

const getMessageTemplates = {
    query: Joi.object().keys({
        name: Joi.string(),
        category: Joi.string(),
        search: Joi.string(),
        sortBy: Joi.string(),
        sortType: Joi.string().valid('asc', 'desc'),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getMessageTemplate = {
    params: Joi.object().keys({
        id: Joi.string().required()
    })
};

const updateMessageTemplate = {
    params: Joi.object().keys({
        id: Joi.string().required()
    }),
    body: Joi.object()
        .keys({
            name: Joi.string(),
            subject: Joi.string(),
            content: Joi.string(),
            category: Joi.string()
        })
        .min(1)
};

const deleteMessageTemplate = {
    params: Joi.object().keys({
        id: Joi.string().required()
    })
};

export default {
    createMessageTemplate,
    getMessageTemplates,
    getMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate
};
