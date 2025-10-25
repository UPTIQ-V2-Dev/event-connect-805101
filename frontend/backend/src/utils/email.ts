import nodemailer from 'nodemailer';
import config from '../config';
import logger from './logger';

export interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransporter({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
                user: config.email.auth.user,
                pass: config.email.auth.pass
            }
        });
    }

    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            const mailOptions = {
                from: options.from || `"Event RSVP Manager" <${config.email.auth.user}>`,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            };

            const info = await this.transporter.sendMail(mailOptions);

            logger.info('Email sent successfully', {
                messageId: info.messageId,
                to: mailOptions.to,
                subject: options.subject
            });
        } catch (error) {
            logger.error('Failed to send email', {
                error: error.message,
                to: options.to,
                subject: options.subject
            });
            throw error;
        }
    }

    async sendWelcomeEmail(email: string, firstName: string, verificationToken?: string): Promise<void> {
        const verificationLink = verificationToken
            ? `${config.frontendUrl}/verify-email?token=${verificationToken}`
            : null;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Event RSVP Manager!</h2>
        
        <p>Hello ${firstName},</p>
        
        <p>Thank you for joining Event RSVP Manager. We're excited to have you on board!</p>
        
        ${
            verificationLink
                ? `
          <p>To get started, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
        `
                : ''
        }
        
        <p>If you have any questions, feel free to contact our support team.</p>
        
        <p>Best regards,<br>The Event RSVP Manager Team</p>
      </div>
    `;

        await this.sendEmail({
            to: email,
            subject: 'Welcome to Event RSVP Manager!',
            html
        });
    }

    async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
        const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        
        <p>Hello ${firstName},</p>
        
        <p>We received a request to reset your password for your Event RSVP Manager account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        
        <p><strong>This link will expire in 10 minutes for security reasons.</strong></p>
        
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <p>Best regards,<br>The Event RSVP Manager Team</p>
      </div>
    `;

        await this.sendEmail({
            to: email,
            subject: 'Reset Your Password - Event RSVP Manager',
            html
        });
    }

    async sendEventInvitation(
        email: string,
        recipientName: string,
        eventTitle: string,
        eventDetails: {
            date: string;
            time: string;
            location: string;
            description: string;
        },
        rsvpLink: string,
        organizerName: string
    ): Promise<void> {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're Invited to ${eventTitle}!</h2>
        
        <p>Dear ${recipientName},</p>
        
        <p>You are cordially invited to <strong>${eventTitle}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Event Details</h3>
          <p><strong>Date:</strong> ${eventDetails.date}</p>
          <p><strong>Time:</strong> ${eventDetails.time}</p>
          <p><strong>Location:</strong> ${eventDetails.location}</p>
        </div>
        
        <p>${eventDetails.description}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${rsvpLink}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            RSVP Now
          </a>
        </div>
        
        <p>Please RSVP by clicking the button above or by visiting:</p>
        <p><a href="${rsvpLink}">${rsvpLink}</a></p>
        
        <p>We look forward to seeing you there!</p>
        
        <p>Best regards,<br>${organizerName}</p>
      </div>
    `;

        await this.sendEmail({
            to: email,
            subject: `You're invited to ${eventTitle}`,
            html
        });
    }

    async sendEventReminder(
        email: string,
        recipientName: string,
        eventTitle: string,
        eventDetails: {
            date: string;
            time: string;
            location: string;
        },
        organizerName: string
    ): Promise<void> {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reminder: ${eventTitle}</h2>
        
        <p>Dear ${recipientName},</p>
        
        <p>This is a friendly reminder that <strong>${eventTitle}</strong> is coming up soon!</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #333;">Event Details</h3>
          <p><strong>Date:</strong> ${eventDetails.date}</p>
          <p><strong>Time:</strong> ${eventDetails.time}</p>
          <p><strong>Location:</strong> ${eventDetails.location}</p>
        </div>
        
        <p>We look forward to seeing you there!</p>
        
        <p>Best regards,<br>${organizerName}</p>
      </div>
    `;

        await this.sendEmail({
            to: email,
            subject: `Reminder: ${eventTitle}`,
            html
        });
    }

    async sendRSVPConfirmation(
        email: string,
        recipientName: string,
        eventTitle: string,
        rsvpStatus: string,
        eventDetails: {
            date: string;
            time: string;
            location: string;
        },
        rsvpLink: string,
        organizerName: string
    ): Promise<void> {
        const statusColor = rsvpStatus === 'attending' ? '#28a745' : rsvpStatus === 'maybe' ? '#ffc107' : '#dc3545';
        const statusText =
            rsvpStatus === 'attending' ? 'attending' : rsvpStatus === 'maybe' ? 'maybe attending' : 'not attending';

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">RSVP Confirmed for ${eventTitle}</h2>
        
        <p>Dear ${recipientName},</p>
        
        <p>Thank you for your RSVP to <strong>${eventTitle}</strong>.</p>
        
        <div style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0;">Your RSVP Status: ${statusText.toUpperCase()}</h3>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Event Details</h3>
          <p><strong>Date:</strong> ${eventDetails.date}</p>
          <p><strong>Time:</strong> ${eventDetails.time}</p>
          <p><strong>Location:</strong> ${eventDetails.location}</p>
        </div>
        
        <p>If you need to make any changes to your RSVP, please use the link below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${rsvpLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Update RSVP
          </a>
        </div>
        
        <p>Best regards,<br>${organizerName}</p>
      </div>
    `;

        await this.sendEmail({
            to: email,
            subject: `RSVP Confirmed for ${eventTitle}`,
            html
        });
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            logger.info('Email service connection verified successfully');
            return true;
        } catch (error) {
            logger.error('Email service connection failed', { error: error.message });
            return false;
        }
    }
}

// Create and export a singleton instance
const emailService = new EmailService();

export default emailService;
export { EmailService };
