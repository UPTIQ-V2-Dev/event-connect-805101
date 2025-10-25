import { eventService } from '../services/index.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const createEvent = catchAsyncWithAuth(async (req, res) => {
    const eventData = {
        ...req.body,
        locationType: req.body.location.type,
        address: req.body.location.address,
        virtualLink: req.body.location.virtualLink
    };

    // Remove location object as we've extracted its properties
    delete eventData.location;

    const event = await eventService.createEvent(eventData, req.user.id);
    res.status(httpStatus.CREATED).send(event);
});

const getEvents = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, ['status', 'search', 'visibility', 'dateStart', 'dateEnd']);

    // Add user filter to only show user's own events
    filter.createdBy = req.user.id;

    const options = pick(req.validatedQuery, ['sortBy', 'limit', 'page', 'sortType']);
    const result = await eventService.queryEvents(filter, options);
    res.send(result);
});

const getRecentEvents = catchAsyncWithAuth(async (req, res) => {
    const events = await eventService.getRecentEvents(req.user.id);
    res.send(events);
});

const getEventById = catchAsyncWithAuth(async (req, res) => {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
    }

    // Check if user has access to this event
    if (event.createdBy !== req.user.id) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Cannot access event created by another user');
    }

    res.send(event);
});

const updateEvent = catchAsyncWithAuth(async (req, res) => {
    let updateData = { ...req.body };

    // Handle location object if provided
    if (req.body.location) {
        updateData.locationType = req.body.location.type;
        updateData.address = req.body.location.address;
        updateData.virtualLink = req.body.location.virtualLink;
        delete updateData.location;
    }

    const event = await eventService.updateEventById(req.params.id, updateData, req.user.id);
    res.send(event);
});

const deleteEvent = catchAsyncWithAuth(async (req, res) => {
    await eventService.deleteEventById(req.params.id, req.user.id);
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    createEvent,
    getEvents,
    getRecentEvents,
    getEventById,
    updateEvent,
    deleteEvent
};
