// email.service.ts

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Replace these values with your email service details
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'oldmovie391@gmail.com',
        pass: 'dvni vjsv aygr dkfe',
      },
    });
  }

  async sendResetPasswordEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: 'oldmovie391@gmail.com',
      to: email,
      subject: 'Password Reset',
      html: `<p>Click the following link to reset your password: <a href="http://localhost:3333/api/auth/reset-password/${resetToken}">Reset Password</a></p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error(`Error sending password reset email to ${email}:`, error);
      throw new Error('Failed to send password reset email');
    }
  }
}
