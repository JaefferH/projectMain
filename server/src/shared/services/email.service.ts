// src/shared/services/email.service.ts
import { env } from '@config/env';
import axios from 'axios';
// Logo URL - replace with your actual logo URL
const LOGO_URL = '../../../docs/imam_hassen_logo.png'; // Update this with your actual logo URL
const SCHOOL_NAME = 'Imam Hassen Medresa';
const SCHOOL_COLOR = '#1B6B4A'; // Islamic green
const SCHOOL_COLOR_LIGHT = '#E8F5E9';

class EmailService {
  private apiKey: string;
  private apiUrl: string;
  private sender: { name: string; email: string };

  constructor() {
    this.apiKey = env.brevoApiKey;
    this.apiUrl = 'https://api.brevo.com/v3/smtp/email';
    this.sender = {
      name: env.brevoSenderName || SCHOOL_NAME,
      email: env.brevoSenderEmail || 'sumeyabesha@gmail.com'
    };
  }

  /**
   * Base email template with header and footer
   */
  private getBaseTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background-color: ${SCHOOL_COLOR}; padding: 20px; text-align: center;">
            <img src="${LOGO_URL}" alt="${SCHOOL_NAME}" style="max-height: 60px; margin-bottom: 8px;" onerror="this.style.display='none'" />
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">${SCHOOL_NAME}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 14px;">Knowledge • Faith • Excellence</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 25px;">
            ${content}
          </div>
          
          <!-- Footer -->
          <div style="background-color: ${SCHOOL_COLOR_LIGHT}; padding: 20px 25px; text-align: center; border-top: 3px solid ${SCHOOL_COLOR};">
            <p style="margin: 0 0 8px; color: ${SCHOOL_COLOR}; font-weight: 600; font-size: 14px;">${SCHOOL_NAME}</p>
            <p style="margin: 0 0 5px; color: #666; font-size: 12px;">
              Addis Ababa, Ethiopia | 📞 +251-XXX-XXXXXX
            </p>
            <p style="margin: 0 0 5px; color: #666; font-size: 12px;">
              ${this.sender.email}
            </p>
            <p style="margin: 15px 0 0; color: #999; font-size: 11px;">
              This is an automated message from ${SCHOOL_NAME}. Please do not reply to this email.
            </p>
            <p style="margin: 5px 0 0; color: #999; font-size: 11px;">
              © ${new Date().getFullYear()} ${SCHOOL_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async sendEmail(
    to: string, 
    toName: string,
    subject: string, 
    htmlContent: string, 
    tags?: string[]
  ) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          sender: this.sender,
          to: [{ email: to, name: toName || 'User' }],
          subject,
          htmlContent: this.getBaseTemplate(htmlContent),
          tags: tags || []
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Email sent successfully:', response.data.messageId);
      return response.data;
    } catch (error: any) {
      console.error('Failed to send email:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, username?: string) {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const name = username || email.split('@')[0];

    const content = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: ${SCHOOL_COLOR}; margin: 0; font-size: 20px;">Password Reset Request</h2>
      </div>
      
      <p style="margin-bottom: 20px;">Assalamu Alaikum${username ? ' <strong>' + username + '</strong>' : ''},</p>
      
      <p style="margin-bottom: 20px; color: #555;">We received a request to reset your password for your ${SCHOOL_NAME} account. Click the button below to create a new password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${SCHOOL_COLOR}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Reset Password
        </a>
      </div>
      
      <div style="background-color: #FFF3CD; border: 1px solid #FFC107; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #856404; font-size: 13px;">
          <strong>Security Notice:</strong> This link will expire in <strong>1 hour</strong>. If you didn't request this reset, please ignore this email. Your account remains secure.
        </p>
      </div>
      
      <p style="color: #777; font-size: 13px; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="background-color: #f0f0f0; padding: 10px; border-radius: 4px; font-size: 12px; word-break: break-all; color: #555;">
        ${resetUrl}
      </p>
    `;

    return this.sendEmail(email, name, `Password Reset - ${SCHOOL_NAME}`, content, ['password-reset']);
  }

  async sendPasswordChangedEmail(email: string, username?: string) {
    const loginUrl = `${env.CLIENT_URL}/login`;
    const name = username || email.split('@')[0];

    const content = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: ${SCHOOL_COLOR}; margin: 0; font-size: 20px;">Password Changed Successfully</h2>
      </div>
      
      <p style="margin-bottom: 20px;">Assalamu Alaikum${username ? ' <strong>' + username + '</strong>' : ''},</p>
      
      <p style="margin-bottom: 20px; color: #555;">Your password has been changed successfully. You can now login with your new password.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${SCHOOL_COLOR}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Login to Your Account
        </a>
      </div>
      
      <div style="background-color: #F8D7DA; border: 1px solid #F5C6CB; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #721C24; font-size: 13px;">
          <strong>Security Alert:</strong> If you didn't make this change, please contact our administration immediately.
        </p>
      </div>
    `;

    try {
      return await this.sendEmail(email, name, `Password Changed - ${SCHOOL_NAME}`, content, ['password-changed']);
    } catch (error) {
      console.error('Failed to send password changed notification:', error);
    }
  }

  async sendWelcomeEmailWithCredentials(
    email: string, 
    username: string, 
    password: string, 
    fullName: string
  ) {
    const loginUrl = `${env.CLIENT_URL}/login`;

    const content = `
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎓</div>
        <h2 style="color: ${SCHOOL_COLOR}; margin: 0; font-size: 20px;">Welcome to ${SCHOOL_NAME}!</h2>
      </div>
      
      <p style="margin-bottom: 20px;">Assalamu Alaikum <strong>${fullName}</strong>,</p>
      
      <p style="margin-bottom: 15px; color: #555;">Your account has been created successfully at <strong>${SCHOOL_NAME}</strong>. Here are your login credentials:</p>
      
      <div style="background-color: ${SCHOOL_COLOR_LIGHT}; border: 2px solid ${SCHOOL_COLOR}; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: #555; font-size: 14px;"><strong>Username:</strong></td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 16px; font-weight: 600; color: ${SCHOOL_COLOR};">${username}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555; font-size: 14px;"><strong>Password:</strong></td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 16px; font-weight: 600; letter-spacing: 1px;">${password}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #FFF3CD; border: 1px solid #FFC107; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #856404; font-size: 13px;">
          <strong>Important:</strong> Please change your password after your first login for security purposes.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${SCHOOL_COLOR}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Login to Your Account
        </a>
      </div>
      
      <p style="color: #777; font-size: 13px; margin-top: 15px;">
        Keep your credentials safe and do not share them with anyone.
      </p>
    `;

    return this.sendEmail(email, fullName, `Welcome to ${SCHOOL_NAME} - Your Account Credentials`, content, ['welcome', 'credentials']);
  }

  /**
   * Send general notification/announcement email
   */
  async sendAnnouncementEmail(email: string, toName: string, title: string, message: string) {
    const content = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: ${SCHOOL_COLOR}; margin: 0; font-size: 20px;">${title}</h2>
      </div>
      
      <p style="margin-bottom: 20px;">Assalamu Alaikum <strong>${toName}</strong>,</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${SCHOOL_COLOR}; margin: 20px 0;">
        <p style="margin: 0; color: #555; font-size: 15px; line-height: 1.8;">${message}</p>
      </div>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${env.CLIENT_URL}" style="display: inline-block; padding: 12px 28px; background-color: ${SCHOOL_COLOR}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Visit Portal
        </a>
      </div>
    `;

    return this.sendEmail(email, toName, `${title} - ${SCHOOL_NAME}`, content, ['announcement']);
  }
}

export const emailService = new EmailService();