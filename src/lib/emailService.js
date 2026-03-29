import nodemailer from 'nodemailer';

// Initialize nodemailer transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send password reset email with verification code
 * @param {string} email - User's email address
 * @param {string} resetCode - 6-digit verification code
 * @param {string} userName - User's name for personalization
 * @returns {Promise<boolean>} True if email sent successfully
 */
export async function sendPasswordResetEmail(email, resetCode, userName = 'User') {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject: 'LivSync - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">LivSync</h1>
            <p style="margin: 10px 0 0 0;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
            <p>Hi ${userName},</p>
            
            <p>We received a request to reset your LivSync password. Use the verification code below to proceed:</p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; color: #999; font-size: 12px;">Verification Code</p>
              <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${resetCode}</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Important:</strong> This code will expire in 30 minutes. If you didn't request a password reset, please ignore this email and your account will remain secure.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email. Please do not reply to this message.
              <br>© 2026 LivSync. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

export default { sendPasswordResetEmail };
