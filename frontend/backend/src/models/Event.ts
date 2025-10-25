import mongoose, { Document, Schema } from 'mongoose';
import { IEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface IEventDocument extends IEvent, Document {
    updateAttendeeCount(): Promise<void>;
    isRSVPOpen(): boolean;
    canUserModify(userId: string, userRole: string): boolean;
}

const locationSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['physical', 'virtual', 'hybrid'],
            required: [true, 'Location type is required']
        },
        address: {
            type: String,
            required: function (this: any) {
                return this.type === 'physical' || this.type === 'hybrid';
            }
        },
        virtualLink: {
            type: String,
            required: function (this: any) {
                return this.type === 'virtual' || this.type === 'hybrid';
            }
        },
        city: String,
        state: String,
        country: String,
        postalCode: String
    },
    { _id: false }
);

const settingsSchema = new Schema(
    {
        allowGuestInvites: {
            type: Boolean,
            default: false
        },
        requireApproval: {
            type: Boolean,
            default: false
        },
        sendReminders: {
            type: Boolean,
            default: true
        },
        collectDietaryRestrictions: {
            type: Boolean,
            default: false
        },
        collectGuestInfo: {
            type: Boolean,
            default: true
        }
    },
    { _id: false }
);

const attendeeCountSchema = new Schema(
    {
        attending: {
            type: Number,
            default: 0
        },
        notAttending: {
            type: Number,
            default: 0
        },
        maybe: {
            type: Number,
            default: 0
        },
        pending: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    { _id: false }
);

const eventSchema = new Schema<IEventDocument>(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
            maxlength: [200, 'Event title cannot exceed 200 characters']
        },
        description: {
            type: String,
            required: [true, 'Event description is required'],
            maxlength: [2000, 'Event description cannot exceed 2000 characters']
        },
        organizer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Event organizer is required']
        },
        startDate: {
            type: Date,
            required: [true, 'Event start date is required'],
            validate: {
                validator: function (this: IEventDocument, value: Date) {
                    return value > new Date();
                },
                message: 'Start date must be in the future'
            }
        },
        endDate: {
            type: Date,
            required: [true, 'Event end date is required'],
            validate: {
                validator: function (this: IEventDocument, value: Date) {
                    return value > this.startDate;
                },
                message: 'End date must be after start date'
            }
        },
        timezone: {
            type: String,
            required: [true, 'Timezone is required'],
            default: 'UTC'
        },
        location: {
            type: locationSchema,
            required: [true, 'Event location is required']
        },
        capacity: {
            type: Number,
            min: [1, 'Capacity must be at least 1'],
            max: [10000, 'Capacity cannot exceed 10,000']
        },
        rsvpDeadline: {
            type: Date,
            validate: {
                validator: function (this: IEventDocument, value: Date) {
                    return !value || value <= this.startDate;
                },
                message: 'RSVP deadline must be before or equal to start date'
            }
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'cancelled', 'completed'],
            default: 'draft'
        },
        categories: {
            type: [String],
            default: [],
            validate: {
                validator: function (categories: string[]) {
                    return categories.length <= 5;
                },
                message: 'Cannot have more than 5 categories'
            }
        },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: function (tags: string[]) {
                    return tags.length <= 10;
                },
                message: 'Cannot have more than 10 tags'
            }
        },
        settings: {
            type: settingsSchema,
            default: () => ({})
        },
        publicRsvpToken: {
            type: String,
            unique: true,
            sparse: true
        },
        attendeeCount: {
            type: attendeeCountSchema,
            default: () => ({})
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
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ isPublic: 1 });
eventSchema.index({ categories: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ publicRsvpToken: 1 });
eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ createdAt: -1 });

// Pre-save middleware
eventSchema.pre('save', function (next) {
    if (this.isNew && this.isPublic && !this.publicRsvpToken) {
        this.publicRsvpToken = uuidv4();
    }
    next();
});

// Instance methods
eventSchema.methods.updateAttendeeCount = async function (): Promise<void> {
    const Attendee = mongoose.model('Attendee');
    const counts = await Attendee.aggregate([
        { $match: { event: this._id } },
        {
            $group: {
                _id: '$rsvpStatus',
                count: { $sum: 1 }
            }
        }
    ]);

    // Reset counts
    this.attendeeCount = {
        attending: 0,
        notAttending: 0,
        maybe: 0,
        pending: 0,
        total: 0
    };

    // Update counts based on aggregation
    counts.forEach((count: any) => {
        switch (count._id) {
            case 'attending':
                this.attendeeCount.attending = count.count;
                break;
            case 'not-attending':
                this.attendeeCount.notAttending = count.count;
                break;
            case 'maybe':
                this.attendeeCount.maybe = count.count;
                break;
            case 'pending':
                this.attendeeCount.pending = count.count;
                break;
        }
    });

    this.attendeeCount.total =
        this.attendeeCount.attending +
        this.attendeeCount.notAttending +
        this.attendeeCount.maybe +
        this.attendeeCount.pending;

    await this.save();
};

eventSchema.methods.isRSVPOpen = function (): boolean {
    const now = new Date();
    const isNotCancelled = this.status !== 'cancelled';
    const isNotCompleted = this.status !== 'completed';
    const beforeDeadline = !this.rsvpDeadline || this.rsvpDeadline > now;
    const beforeStart = this.startDate > now;

    return isNotCancelled && isNotCompleted && beforeDeadline && beforeStart;
};

eventSchema.methods.canUserModify = function (userId: string, userRole: string): boolean {
    if (userRole === 'admin') return true;
    return this.organizer.toString() === userId;
};

// Static methods
eventSchema.statics.findPublicEvents = function () {
    return this.find({
        isPublic: true,
        status: 'published',
        startDate: { $gt: new Date() }
    });
};

eventSchema.statics.findUpcomingEvents = function (organizerId?: string) {
    const query: any = {
        status: { $in: ['published', 'draft'] },
        startDate: { $gt: new Date() }
    };

    if (organizerId) {
        query.organizer = organizerId;
    }

    return this.find(query).sort({ startDate: 1 });
};

const Event = mongoose.model<IEventDocument>('Event', eventSchema);

export default Event;
