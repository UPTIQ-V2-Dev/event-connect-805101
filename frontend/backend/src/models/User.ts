import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

export interface IUserDocument extends IUser, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateRefreshToken(): string;
    addRefreshToken(token: string): Promise<void>;
    removeRefreshToken(token: string): Promise<void>;
    removeAllRefreshTokens(): Promise<void>;
}

const userSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false // Don't include password in queries by default
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters']
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters']
        },
        role: {
            type: String,
            enum: ['admin', 'organizer', 'user'],
            default: 'user'
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: {
            type: String,
            select: false
        },
        passwordResetToken: {
            type: String,
            select: false
        },
        passwordResetExpires: {
            type: Date,
            select: false
        },
        refreshTokens: {
            type: [String],
            default: [],
            select: false
        },
        lastLogin: {
            type: Date
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret) {
                delete ret.password;
                delete ret.refreshTokens;
                delete ret.emailVerificationToken;
                delete ret.passwordResetToken;
                delete ret.passwordResetExpires;
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateRefreshToken = function (): string {
    const crypto = require('crypto');
    return crypto.randomBytes(40).toString('hex');
};

userSchema.methods.addRefreshToken = async function (token: string): Promise<void> {
    this.refreshTokens.push(token);
    await this.save();
};

userSchema.methods.removeRefreshToken = async function (token: string): Promise<void> {
    this.refreshTokens = this.refreshTokens.filter((t: string) => t !== token);
    await this.save();
};

userSchema.methods.removeAllRefreshTokens = async function (): Promise<void> {
    this.refreshTokens = [];
    await this.save();
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function () {
    return this.find({ isActive: true });
};

const User = mongoose.model<IUserDocument>('User', userSchema);

export default User;
