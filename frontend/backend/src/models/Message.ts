import mongoose, { Document, Schema } from 'mongoose';
import { IMessage } from '../types';

export interface IMessageDocument extends IMessage, Document {
    canUserModify(userId: string, userRole: string): boolean;
    markAsSent(): Promise<void>;
    updateDeliveryStatus(status: 'sent' | 'delivered' | 'failed'): Promise<void>;
}

const recipientsSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['all', 'attending', 'not-attending', 'maybe', 'pending', 'custom'],
            required: [true, 'Recipient type is required']
        },
        userIds: {
            type: [Schema.Types.ObjectId],
            ref: 'User',
            default: []
        },
        attendeeIds: {
            type: [Schema.Types.ObjectId],
            ref: 'Attendee',
            default: []
        }
    },
    { _id: false }
);

const deliveryStatusSchema = new Schema(
    {
        sent: {
            type: Number,
            default: 0
        },
        delivered: {
            type: Number,
            default: 0
        },
        failed: {
            type: Number,
            default: 0
        },
        pending: {
            type: Number,
            default: 0
        }
    },
    { _id: false }
);

const messageSchema = new Schema<IMessageDocument>(
    {
        event: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event is required']
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender is required']
        },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
            maxlength: [200, 'Subject cannot exceed 200 characters']
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            maxlength: [5000, 'Content cannot exceed 5000 characters']
        },
        messageType: {
            type: String,
            enum: ['announcement', 'reminder', 'update', 'invitation'],
            required: [true, 'Message type is required']
        },
        recipients: {
            type: recipientsSchema,
            required: [true, 'Recipients are required']
        },
        scheduledFor: {
            type: Date,
            validate: {
                validator: function (this: IMessageDocument, value: Date) {
                    return !value || value > new Date();
                },
                message: 'Scheduled time must be in the future'
            }
        },
        sentAt: {
            type: Date
        },
        deliveryStatus: {
            type: deliveryStatusSchema,
            default: () => ({})
        },
        template: {
            type: Schema.Types.ObjectId,
            ref: 'MessageTemplate'
        },
        isScheduled: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ['draft', 'scheduled', 'sent', 'failed'],
            default: 'draft'
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret) {
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Indexes
messageSchema.index({ event: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ scheduledFor: 1 });
messageSchema.index({ sentAt: 1 });
messageSchema.index({ createdAt: -1 });

// Pre-save middleware
messageSchema.pre('save', function (next) {
    // Set isScheduled based on scheduledFor
    if (this.scheduledFor && this.scheduledFor > new Date()) {
        this.isScheduled = true;
        if (this.status === 'draft') {
            this.status = 'scheduled';
        }
    } else {
        this.isScheduled = false;
    }

    next();
});

// Instance methods
messageSchema.methods.canUserModify = function (userId: string, userRole: string): boolean {
    if (userRole === 'admin') return true;

    // Only the sender can modify the message
    if (this.sender.toString() === userId) return true;

    // Event organizer can also modify messages for their events
    if (this.event && this.event.organizer && this.event.organizer.toString() === userId) {
        return true;
    }

    return false;
};

messageSchema.methods.markAsSent = async function (): Promise<void> {
    this.status = 'sent';
    this.sentAt = new Date();
    this.isScheduled = false;
    await this.save();
};

messageSchema.methods.updateDeliveryStatus = async function (status: 'sent' | 'delivered' | 'failed'): Promise<void> {
    switch (status) {
        case 'sent':
            this.deliveryStatus.sent += 1;
            break;
        case 'delivered':
            this.deliveryStatus.delivered += 1;
            break;
        case 'failed':
            this.deliveryStatus.failed += 1;
            break;
    }

    // Update pending count
    const total = this.deliveryStatus.sent + this.deliveryStatus.delivered + this.deliveryStatus.failed;
    this.deliveryStatus.pending = Math.max(0, this.deliveryStatus.pending - 1);

    await this.save();
};

// Static methods
messageSchema.statics.findByEvent = function (eventId: string) {
    return this.find({ event: eventId })
        .populate('sender', 'firstName lastName email')
        .populate('template', 'name templateType')
        .sort({ createdAt: -1 });
};

messageSchema.statics.findScheduledMessages = function () {
    return this.find({
        status: 'scheduled',
        scheduledFor: { $lte: new Date() }
    })
        .populate('event')
        .populate('sender', 'firstName lastName email');
};

messageSchema.statics.findByType = function (eventId: string, messageType: string) {
    return this.find({
        event: eventId,
        messageType: messageType
    })
        .populate('sender', 'firstName lastName email')
        .sort({ createdAt: -1 });
};

const Message = mongoose.model<IMessageDocument>('Message', messageSchema);

export default Message;
