import { messageService } from "../services/index.js";
import catchAsyncWithAuth from "../utils/catchAsyncWithAuth.js";
import httpStatus from 'http-status';
const createMessage = catchAsyncWithAuth(async (req, res) => {
    const { eventId } = req.params;
    const { subject, content, recipientFilter, scheduledDate } = req.body;
    const createdBy = req.user.id;
    const message = await messageService.createMessage({
        eventId,
        subject,
        content,
        recipientFilter,
        scheduledDate,
        createdBy
    });
    const response = messageService.transformMessageToResponse(message);
    res.status(httpStatus.CREATED).send(response);
});
const getEventMessages = catchAsyncWithAuth(async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;
    const messages = await messageService.getEventMessages(eventId, userId);
    const response = messages.map(message => messageService.transformMessageToResponse(message));
    res.send(response);
});
const scheduleMessage = catchAsyncWithAuth(async (req, res) => {
    const { eventId, subject, content, recipientFilter, scheduledDate } = req.body;
    const createdBy = req.user.id;
    const message = await messageService.scheduleMessage({
        eventId,
        subject,
        content,
        recipientFilter,
        scheduledDate,
        createdBy
    });
    const response = messageService.transformMessageToResponse(message);
    res.status(httpStatus.CREATED).send(response);
});
const getDeliveryStatus = catchAsyncWithAuth(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;
    const deliveryStatus = await messageService.getMessageDeliveryStatus(messageId, userId);
    res.send(deliveryStatus);
});
export default {
    createMessage,
    getEventMessages,
    scheduleMessage,
    getDeliveryStatus
};
