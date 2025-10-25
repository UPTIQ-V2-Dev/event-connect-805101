import Joi from 'joi';

const createMessage = {
    params: Joi.object().keys({
        eventId: Joi.string().required()
    }),
    body: Joi.object().keys({
        subject: Joi.string().required().min(1).max(255),
        content: Joi.string().required().min(1),
        recipientFilter: Joi.object()
            .keys({
                rsvpStatus: Joi.array().items(Joi.string().valid('attending', 'notAttending', 'maybe', 'pending')),
                registrationDateRange: Joi.object().keys({
                    start: Joi.string().isoDate(),
                    end: Joi.string().isoDate()
                }),
                searchQuery: Joi.string()
            })
            .required(),
        scheduledDate: Joi.string().isoDate()
    })
};

const getEventMessages = {
    params: Joi.object().keys({
        eventId: Joi.string().required()
    })
};

const scheduleMessage = {
    body: Joi.object().keys({
        eventId: Joi.string().required(),
        subject: Joi.string().required().min(1).max(255),
        content: Joi.string().required().min(1),
        recipientFilter: Joi.object()
            .keys({
                rsvpStatus: Joi.array().items(Joi.string().valid('attending', 'notAttending', 'maybe', 'pending')),
                registrationDateRange: Joi.object().keys({
                    start: Joi.string().isoDate(),
                    end: Joi.string().isoDate()
                }),
                searchQuery: Joi.string()
            })
            .required(),
        scheduledDate: Joi.string().isoDate().required()
    })
};

const getDeliveryStatus = {
    params: Joi.object().keys({
        messageId: Joi.string().required()
    })
};

export default {
    createMessage,
    getEventMessages,
    scheduleMessage,
    getDeliveryStatus
};
