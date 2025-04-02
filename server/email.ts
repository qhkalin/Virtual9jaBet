import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const defaultFromAddress = "Virtual9JaBet <coastalloan60@gmail.com>";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // True for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "coastalloan60@gmail.com",
    pass: process.env.SMTP_PASS || "sphw oizv szzy fpgw",
  },
});

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  try {
    // Add header logo and styling to HTML content
    const enhancedHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #002B5B;
            padding: 20px;
            text-align: center;
            color: white;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
          }
          .accent {
            color: #FFD700;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo"><span class="accent">Virtual</span>9ja<span class="accent">Bet</span></div>
          </div>
          <div class="content">
            ${html}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Virtual9jaBet. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send mail with defined transport object
    await transporter.sendMail({
      from: defaultFromAddress,
      to,
      subject,
      text,
      html: enhancedHtml,
    });

    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
