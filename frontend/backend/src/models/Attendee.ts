import mongoose, { Document, Schema } from 'mongoose';
import { IAttendee } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface IAttendeeDocument extends IAttendee, Document {
    updateEventAttendeeCount(): Promise<void>;
    isGuest(): boolean;
    getDisplayName(): string;
    getContactEmail(): string;
}

const guestInfoSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters']
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters']
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
        },
        phone: {
            type: String,
            trim: true
        }
    },
    { _id: false }
);

const attendeeSchema = new Schema<IAttendeeDocument>(
    {
        event: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Event is required']
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            sparse: true
        },
        guestInfo: {
            type: guestInfoSchema,
            validate: {
                validator: function (this: IAttendeeDocument) {
                    // Either user or guestInfo must be provided, but not both
                    return (this.user && !this.guestInfo) || (!this.user && this.guestInfo);
                },
                message: 'Either user or guest information must be provided'
            }
        },
        rsvpStatus: {
            type: String,
            enum: ['attending', 'not-attending', 'maybe', 'pending'],
            default: 'pending'
        },
        checkedIn: {
            type: Boolean,
            default: false
        },
        checkInTime: {
            type: Date
        },
        dietaryRestrictions: {
            type: String,
            maxlength: [500, 'Dietary restrictions cannot exceed 500 characters']
        },
        additionalNotes: {
            type: String,
            maxlength: [1000, 'Additional notes cannot exceed 1000 characters']
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        rsvpToken: {
            type: String,
            unique: true,
            sparse: true
        },
        rsvpDate: {
            type: Date,
            default: Date.now
        },
        remindersSent: {
            type: Number,
            default: 0
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
attendeeSchema.index({ event: 1 });
attendeeSchema.index({ user: 1 });
attendeeSchema.index({ rsvpStatus: 1 });
attendeeSchema.index({ checkedIn: 1 });
attendeeSchema.index({ rsvpToken: 1 });
attendeeSchema.index({ event: 1, user: 1 }, { unique: true, sparse: true });
attendeeSchema.index({ 'event': 1, 'guestInfo.email': 1 });
attendeeSchema.index({ createdAt: -1 });

// Compound index for guest uniqueness per event
attendeeSchema.index(
    { 'event': 1, 'guestInfo.email': 1 },
    {
        unique: true,
        sparse: true,
        partialFilterExpression: { guestInfo: { $exists: true } }
    }
);

// Pre-save middleware
attendeeSchema.pre('save', function (next) {
    // Generate RSVP token for guests if not present
    if (this.isNew && this.guestInfo && !this.rsvpToken) {
        this.rsvpToken = uuidv4();
    }

    // Set check-in time when checking in
    if (this.isModified('checkedIn') && this.checkedIn && !this.checkInTime) {
        this.checkInTime = new Date();
    }

    next();
});

// Post-save middleware to update event attendee count
attendeeSchema.post('save', async function () {
    await this.updateEventAttendeeCount();
});

// Post-remove middleware to update event attendee count
attendeeSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await doc.updateEventAttendeeCount();
    }
});

// Instance methods
attendeeSchema.methods.updateEventAttendeeCount = async function (): Promise<void> {
    const Event = mongoose.model('Event');
    const event = await Event.findById(this.event);
    if (event) {
        await event.updateAttendeeCount();
    }
};

attendeeSchema.methods.isGuest = function (): boolean {
    return !this.user && !!this.guestInfo;
};

attendeeSchema.methods.getDisplayName = function (): string {
    if (this.user) {
        return `${this.user.firstName} ${this.user.lastName}`;
    } else if (this.guestInfo) {
        return `${this.guestInfo.firstName} ${this.guestInfo.lastName}`;
    }
    return 'Unknown';
};

attendeeSchema.methods.getContactEmail = function (): string {
    if (this.user) {
        return this.user.email;
    } else if (this.guestInfo) {
        return this.guestInfo.email;
    }
    return '';
};

// Static methods
attendeeSchema.statics.findByEvent = function (eventId: string) {
    return this.find({ event: eventId })
        .populate('user', 'firstName lastName email')
        .populate('invitedBy', 'firstName lastName email');
};

attendeeSchema.statics.findByRSVPToken = function (token: string) {
    return this.findOne({ rsvpToken: token }).populate('event').populate('user', 'firstName lastName email');
};

attendeeSchema.statics.getEventStats = function (eventId: string) {
    return this.aggregate([
        { $match: { event: new mongoose.Types.ObjectId(eventId) } },
        {
            $group: {
                _id: '$rsvpStatus',
                count: { $sum: 1 }
            }
        }
    ]);
};

attendeeSchema.statics.findAttending = function (eventId: string) {
    return this.find({
        event: eventId,
        rsvpStatus: 'attending'
    })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 });
};

const Attendee = mongoose.model<IAttendeeDocument>('Attendee', attendeeSchema);

export default Attendee;
