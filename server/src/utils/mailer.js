const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configure Transporter
const createTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return null;
};

const transporter = createTransporter();

// Send Email Function
const sendEmail = async (options) => {
    // 1. Try sending via SMTP
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: process.env.EMAIL_FROM || '"StudentDB Library" <library@studentdb.com>',
                to: options.email,
                subject: options.subject,
                text: options.message,
                html: options.html
            });
            console.log('Message sent: %s', info.messageId);
            return true;
        } catch (error) {
            console.error("SMTP Failed, falling back to log:", error.message);
        }
    }

    // 2. Fallback: Log to file
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const logEntry = `
--- EMAIL LOG [${new Date().toISOString()}] ---
To: ${options.email}
Subject: ${options.subject}
Message: ${options.message}
-----------------------------------------------
`;

    fs.appendFileSync(path.join(logDir, 'emails.log'), logEntry);
    console.log(`[Mock Mailer] Email logged to ${path.join(logDir, 'emails.log')}`);
    return true;
};

module.exports = sendEmail;
