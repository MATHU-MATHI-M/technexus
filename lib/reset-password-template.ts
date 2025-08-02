export function getPasswordResetEmailTemplate(resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - TenderChain</title>
      <style>
        .button {
          background-color: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="color: #2563eb; margin: 0;">TenderChain</h1>
          <p style="color: #666; margin: 5px 0;">Password Reset Request</p>
        </div>
        
        <div style="padding: 20px; color: #333;">
          <p>Hello,</p>
          <p>You requested a password reset for your TenderChain account. Click the button below to set a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
          </div>
          
          <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
          
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            This link will expire in 1 hour for security reasons.<br>
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
          <p style="font-size: 12px;">
            TenderChain - Secure Blockchain-Based Tender Management<br>
            This is an automated email, please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
