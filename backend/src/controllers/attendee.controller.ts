import { attendeeService } from '../services/index.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsync from '../utils/catchAsync.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const createRsvp = catchAsync(async (req, res) => {
    const rsvpData = pick(req.body, ['eventId', 'name', 'email', 'rsvpStatus', 'dietaryRequirements', 'guestInfo']) as {
        eventId: string;
        name: string;
        email: string;
        rsvpStatus: string;
        dietaryRequirements?: string;
        guestInfo?: {
            phone?: string;
            company?: string;
        };
    };
    const result = await attendeeService.createRsvp(rsvpData);
    res.status(httpStatus.CREATED).send(result);
});

const getEventAttendees = catchAsyncWithAuth(async (req, res) => {
    const result = await attendeeService.getEventAttendees(req.params.eventId);
    res.send(result);
});

const updateAttendeeStatus = catchAsyncWithAuth(async (req, res) => {
    const { eventId, attendeeId } = req.params;
    const { status } = req.body;
    const result = await attendeeService.updateAttendeeStatus(eventId, attendeeId, status, req.user.id);
    res.send(result);
});

const getAttendeeById = catchAsync(async (req, res) => {
    const attendee = await attendeeService.getAttendeeById(req.params.attendeeId);
    if (!attendee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Attendee not found');
    }
    res.send(attendee);
});

const getAttendees = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, ['eventId', 'rsvpStatus', 'email']);
    const options = pick(req.validatedQuery, ['sortBy', 'limit', 'page']);
    const result = await attendeeService.queryAttendees(filter, options);
    res.send(result);
});

const deleteAttendee = catchAsyncWithAuth(async (req, res) => {
    await attendeeService.deleteAttendeeById(req.params.attendeeId);
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    createRsvp,
    getEventAttendees,
    updateAttendeeStatus,
    getAttendeeById,
    getAttendees,
    deleteAttendee
};
