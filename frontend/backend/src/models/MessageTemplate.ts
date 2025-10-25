import mongoose, { Document, Schema } from 'mongoose';
import { IMessageTemplate } from '../types';

export interface IMessageTemplateDocument extends IMessageTemplate, Document {
    canUserModify(userId: string, userRole: string): boolean;
    processTemplate(variables: Record<string, any>): { subject: string; content: string };
}

const messageTemplateSchema = new Schema<IMessageTemplateDocument>(
    {
        name: {
            type: String,
            required: [true, 'Template name is required'],
            trim: true,
            maxlength: [100, 'Template name cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        subject: {
            type: String,
            required: [true, 'Subject template is required'],
            trim: true,
            maxlength: [200, 'Subject cannot exceed 200 characters']
        },
        content: {
            type: String,
            required: [true, 'Content template is required'],
            maxlength: [5000, 'Content cannot exceed 5000 characters']
        },
        templateType: {
            type: String,
            enum: ['invitation', 'reminder', 'confirmation', 'update', 'cancellation', 'custom'],
            required: [true, 'Template type is required']
        },
        variables: {
            type: [String],
            default: [],
            validate: {
                validator: function (variables: string[]) {
                    // Ensure all variables are valid identifiers
                    return variables.every(variable => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable));
                },
                message: 'Variables must be valid identifiers'
            }
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator is required']
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
messageTemplateSchema.index({ templateType: 1 });
messageTemplateSchema.index({ createdBy: 1 });
messageTemplateSchema.index({ isDefault: 1 });
messageTemplateSchema.index({ name: 'text', description: 'text' });
messageTemplateSchema.index({ createdAt: -1 });

// Ensure only one default template per type
messageTemplateSchema.index(
    { templateType: 1, isDefault: 1 },
    {
        unique: true,
        partialFilterExpression: { isDefault: true }
    }
);

// Pre-save middleware to extract variables from template content
messageTemplateSchema.pre('save', function (next) {
    // Extract variables from subject and content
    const variableRegex = /{{(\w+)}}/g;
    const extractedVars = new Set<string>();

    // Extract from subject
    let match;
    while ((match = variableRegex.exec(this.subject)) !== null) {
        extractedVars.add(match[1]!);
    }

    // Reset regex
    variableRegex.lastIndex = 0;

    // Extract from content
    while ((match = variableRegex.exec(this.content)) !== null) {
        extractedVars.add(match[1]!);
    }

    this.variables = Array.from(extractedVars);
    next();
});

// Instance methods
messageTemplateSchema.methods.canUserModify = function (userId: string, userRole: string): boolean {
    if (userRole === 'admin') return true;
    return this.createdBy.toString() === userId;
};

messageTemplateSchema.methods.processTemplate = function (variables: Record<string, any>): {
    subject: string;
    content: string;
} {
    let processedSubject = this.subject;
    let processedContent = this.content;

    // Replace variables in subject and content
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const stringValue = value != null ? String(value) : '';

        processedSubject = processedSubject.replace(regex, stringValue);
        processedContent = processedContent.replace(regex, stringValue);
    });

    return {
        subject: processedSubject,
        content: processedContent
    };
};

// Static methods
messageTemplateSchema.statics.findByType = function (templateType: string) {
    return this.find({ templateType })
        .populate('createdBy', 'firstName lastName email')
        .sort({ isDefault: -1, createdAt: -1 });
};

messageTemplateSchema.statics.findDefault = function (templateType: string) {
    return this.findOne({ templateType, isDefault: true }).populate('createdBy', 'firstName lastName email');
};

messageTemplateSchema.statics.createDefaultTemplates = async function () {
    const defaultTemplates = [
        {
            name: 'Default Invitation',
            description: 'Standard event invitation template',
            subject: "You're invited to {{eventTitle}}",
            content: `Dear {{recipientName}},

You are cordially invited to {{eventTitle}}.

Event Details:
Date: {{eventDate}}
Time: {{eventTime}}
Location: {{eventLocation}}

{{eventDescription}}

Please RSVP by clicking the link below:
{{rsvpLink}}

Best regards,
{{organizerName}}`,
            templateType: 'invitation',
            isDefault: true,
            createdBy: null // System template
        },
        {
            name: 'Default Reminder',
            description: 'Standard event reminder template',
            subject: 'Reminder: {{eventTitle}} is tomorrow',
            content: `Dear {{recipientName}},

This is a friendly reminder that {{eventTitle}} is scheduled for tomorrow.

Event Details:
Date: {{eventDate}}
Time: {{eventTime}}
Location: {{eventLocation}}

We look forward to seeing you there!

Best regards,
{{organizerName}}`,
            templateType: 'reminder',
            isDefault: true,
            createdBy: null // System template
        },
        {
            name: 'Default Confirmation',
            description: 'RSVP confirmation template',
            subject: 'RSVP Confirmed for {{eventTitle}}',
            content: `Dear {{recipientName}},

Thank you for your RSVP to {{eventTitle}}. Your attendance has been confirmed.

Event Details:
Date: {{eventDate}}
Time: {{eventTime}}
Location: {{eventLocation}}

If you need to make any changes to your RSVP, please use the link below:
{{rsvpLink}}

Best regards,
{{organizerName}}`,
            templateType: 'confirmation',
            isDefault: true,
            createdBy: null // System template
        }
    ];

    // Create templates only if they don't exist
    for (const template of defaultTemplates) {
        const existing = await this.findOne({
            templateType: template.templateType,
            isDefault: true
        });

        if (!existing) {
            await this.create(template);
        }
    }
};

const MessageTemplate = mongoose.model<IMessageTemplateDocument>('MessageTemplate', messageTemplateSchema);

export default MessageTemplate;
