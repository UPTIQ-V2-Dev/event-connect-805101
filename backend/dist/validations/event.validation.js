import Joi from 'joi';
const locationSchema = Joi.object().keys({
    type: Joi.string().required().valid('physical', 'virtual'),
    address: Joi.string().when('type', {
        is: 'physical',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    virtualLink: Joi.string().uri().when('type', {
        is: 'virtual',
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});
const createEvent = {
    body: Joi.object().keys({
        title: Joi.string().required().min(1).max(255),
        description: Joi.string().required().min(1),
        startDate: Joi.date().iso().required(),
        endDate: Joi.date().iso().min(Joi.ref('startDate')),
        location: locationSchema.required(),
        capacity: Joi.number().integer().min(1),
        rsvpDeadline: Joi.date().iso(),
        visibility: Joi.string().required().valid('public', 'private')
    })
};
const getEvents = {
    query: Joi.object().keys({
        status: Joi.string().valid('draft', 'published', 'cancelled'),
        search: Joi.string(),
        visibility: Joi.string().valid('public', 'private'),
        dateStart: Joi.date().iso(),
        dateEnd: Joi.date().iso().min(Joi.ref('dateStart')),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().default('createdAt'),
        sortType: Joi.string().valid('asc', 'desc').default('desc')
    })
};
const getEventById = {
    params: Joi.object().keys({
        id: Joi.string().required()
    })
};
const updateEvent = {
    params: Joi.object().keys({
        id: Joi.string().required()
    }),
    body: Joi.object()
        .keys({
        title: Joi.string().min(1).max(255),
        description: Joi.string().min(1),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso(),
        location: Joi.object().keys({
            type: Joi.string().valid('physical', 'virtual'),
            address: Joi.string().when('type', {
                is: 'physical',
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            virtualLink: Joi.string().uri().when('type', {
                is: 'virtual',
                then: Joi.required(),
                otherwise: Joi.optional()
            })
        }),
        capacity: Joi.number().integer().min(1),
        rsvpDeadline: Joi.date().iso(),
        visibility: Joi.string().valid('public', 'private'),
        status: Joi.string().valid('draft', 'published', 'cancelled')
    })
        .min(1)
        .custom((value, helpers) => {
        // Custom validation to ensure endDate is after startDate if both are provided
        if (value.startDate && value.endDate && new Date(value.endDate) <= new Date(value.startDate)) {
            return helpers.error('any.invalid', { message: 'endDate must be after startDate' });
        }
        return value;
    })
};
const deleteEvent = {
    params: Joi.object().keys({
        id: Joi.string().required()
    })
};
export default {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
};
