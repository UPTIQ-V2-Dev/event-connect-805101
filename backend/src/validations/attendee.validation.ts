import Joi from 'joi';

const createRsvp = {
    body: Joi.object().keys({
        eventId: Joi.string().required(),
        name: Joi.string().required(),
        email: Joi.string().required().email(),
        rsvpStatus: Joi.string().required().valid('attending', 'notAttending', 'maybe', 'pending'),
        dietaryRequirements: Joi.string().allow('').optional(),
        guestInfo: Joi.object()
            .keys({
                phone: Joi.string().allow('').optional(),
                company: Joi.string().allow('').optional()
            })
            .optional()
    })
};

const getEventAttendees = {
    params: Joi.object().keys({
        eventId: Joi.string().required()
    })
};

const updateAttendeeStatus = {
    params: Joi.object().keys({
        eventId: Joi.string().required(),
        attendeeId: Joi.string().required()
    }),
    body: Joi.object().keys({
        status: Joi.string().required().valid('attending', 'notAttending', 'maybe', 'pending')
    })
};

const getAttendeeById = {
    params: Joi.object().keys({
        attendeeId: Joi.string().required()
    })
};

const queryAttendees = {
    query: Joi.object().keys({
        eventId: Joi.string(),
        rsvpStatus: Joi.string().valid('attending', 'notAttending', 'maybe', 'pending'),
        email: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const deleteAttendee = {
    params: Joi.object().keys({
        attendeeId: Joi.string().required()
    })
};

export default {
    createRsvp,
    getEventAttendees,
    updateAttendeeStatus,
    getAttendeeById,
    queryAttendees,
    deleteAttendee
};
