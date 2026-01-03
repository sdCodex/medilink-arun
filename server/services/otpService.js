const bcrypt = require('bcryptjs');
const OTPLog = require('../models/OTPLog');
const Notification = require('../models/Notification');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

// Initialize Twilio client (only if credentials are provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Initialize Nodemailer transporter
let emailTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
}

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via SMS
 */
const sendSMS = async (mobile, otp) => {
    try {
        if (!twilioClient) {
            console.log(`📱 [DEV MODE] SMS to ${mobile}: Your MedLink OTP is ${otp}. Valid for 5 minutes.`);
            return {
                success: true,
                message: 'OTP logged (development mode - Twilio not configured)'
            };
        }

        const message = await twilioClient.messages.create({
            body: `Your MedLink OTP is ${otp}. Valid for 5 minutes. Do not share this code.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: mobile
        });

        console.log(`✅ SMS sent to ${mobile}: ${message.sid}`);
        return {
            success: true,
            messageId: message.sid
        };
    } catch (error) {
        console.error(`❌ SMS Error to ${mobile}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send OTP via WhatsApp
 */
const sendWhatsApp = async (mobile, otp) => {
    try {
        if (!twilioClient || !process.env.TWILIO_WHATSAPP_NUMBER) {
            console.log(`📱 [DEV MODE] WhatsApp to ${mobile}: Your MedLink OTP is ${otp}. Valid for 5 minutes.`);
            return {
                success: true,
                message: 'OTP logged (development mode - Twilio/WhatsApp not configured)'
            };
        }

        const message = await twilioClient.messages.create({
            body: `Your MedLink OTP is ${otp}. Valid for 5 minutes. Do not share this code.`,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${mobile}`
        });

        console.log(`✅ WhatsApp sent to ${mobile}: ${message.sid}`);
        return {
            success: true,
            messageId: message.sid
        };
    } catch (error) {
        console.error(`❌ WhatsApp Error to ${mobile}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send OTP via Email
 */
const sendEmail = async (email, otp, name = 'User') => {
    try {
        if (!emailTransporter) {
            console.log(`📧 [DEV MODE] Email to ${email}: Your MedLink OTP is ${otp}. Valid for 5 minutes.`);
            return {
                success: true,
                message: 'OTP logged (development mode - SMTP not configured)'
            };
        }

        const mailOptions = {
            from: `"MedLink" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your MedLink OTP Code',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 MedLink</h1>
              <p>Digital Health Records & Emergency Access</p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>You requested an OTP for your MedLink account. Use the code below to proceed:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>This OTP is valid for 5 minutes.</strong></p>
              <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
              
              <div class="footer">
                <p>This is an automated email, please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} MedLink. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${email}: ${info.messageId}`);

        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error(`❌ Email Error to ${email}:`, error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

/**
 * Generate and send OTP to both mobile and email
 */
const sendOTP = async ({ email, mobile, purpose, recipientId, recipientModel, name }) => {
    try {
        // Generate OTP
        const otp = generateOTP();

        // Hash OTP before storing
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        // Calculate expiry time (5 minutes from now)
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Save OTP to database
        const otpLog = await OTPLog.create({
            email,
            mobile,
            otp: hashedOTP,
            purpose,
            expiresAt,
            maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3
        });

        // Send OTP via SMS, WhatsApp and Email concurrently
        const results = await Promise.allSettled([
            sendSMS(mobile, otp),
            sendWhatsApp(mobile, otp),
            sendEmail(email, otp, name)
        ]);

        // Log notifications
        const notifications = [];

        // SMS Notification
        if (results[0].status === 'fulfilled' && results[0].value.success) {
            notifications.push({
                recipient: { model: recipientModel, id: recipientId, mobile },
                type: 'sms',
                content: `Your MedLink OTP is ${otp}`,
                purpose: 'otp',
                status: 'sent',
                sentAt: new Date()
            });
        } else {
            notifications.push({
                recipient: { model: recipientModel, id: recipientId, mobile },
                type: 'sms',
                content: `Your MedLink OTP is ${otp}`,
                purpose: 'otp',
                status: 'failed',
                failureReason: results[0].status === 'fulfilled' ? results[0].value.error : results[0].reason?.message
            });
        }

        // WhatsApp Notification
        if (results[1].status === 'fulfilled' && results[1].value.success) {
            notifications.push({
                recipient: { model: recipientModel, id: recipientId, mobile },
                type: 'whatsapp',
                content: `Your MedLink OTP is ${otp}`,
                purpose: 'otp',
                status: 'sent',
                sentAt: new Date()
            });
        } else {
            notifications.push({
                recipient: { model: recipientModel, id: recipientId, mobile },
                type: 'whatsapp',
                content: `Your MedLink OTP is ${otp}`,
                purpose: 'otp',
                status: 'failed',
                failureReason: results[1].status === 'fulfilled' ? results[1].value.error : results[1].reason?.message
            });
        }

        // Email Notification
        if (results[2].status === 'fulfilled' && results[2].value.success) {
            notifications.push({
                recipient: { model: recipientModel, id: recipientId, email },
                type: 'email',
                subject: 'Your MedLink OTP Code',
                content: `Your MedLink OTP is ${otp}`,
                purpose: 'otp',
                status: 'sent',
                sentAt: new Date()
            });
        } else {
            notifications.push({
                recipient: { model: recipientModel, id: recipientId, email },
                type: 'email',
                subject: 'Your MedLink OTP Code',
                content: `Your MedLink OTP is ${otp}`,
                purpose: 'otp',
                status: 'failed',
                failureReason: results[2].status === 'fulfilled' ? results[2].value.error : results[2].reason?.message
            });
        }

        // Save notifications
        await Notification.insertMany(notifications);

        console.log(`✅ OTP sent to ${email} and ${mobile} for ${purpose}`);

        return {
            success: true,
            message: 'OTP sent successfully to email and mobile',
            expiresAt,
            otpId: otpLog._id
        };
    } catch (error) {
        console.error('❌ Send OTP Error:', error);
        throw new Error(`Failed to send OTP: ${error.message}`);
    }
};

/**
 * Verify OTP
 */
const verifyOTP = async ({ email, mobile, otp, purpose }) => {
    try {
        // Find the latest non-verified OTP for this email/mobile and purpose
        const otpLog = await OTPLog.findOne({
            $or: [{ email }, { mobile }],
            purpose,
            isVerified: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!otpLog) {
            return {
                success: false,
                message: 'OTP expired or not found. Please request a new one.'
            };
        }

        // Check if max attempts exceeded
        if (otpLog.attempts >= otpLog.maxAttempts) {
            return {
                success: false,
                message: `Maximum OTP verification attempts (${otpLog.maxAttempts}) exceeded. Please request a new OTP.`
            };
        }

        // Increment attempts
        otpLog.attempts += 1;
        await otpLog.save();

        // Compare OTP
        const isMatch = await bcrypt.compare(otp, otpLog.otp);

        if (!isMatch) {
            const remainingAttempts = otpLog.maxAttempts - otpLog.attempts;
            return {
                success: false,
                message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            };
        }

        // Mark as verified
        otpLog.isVerified = true;
        otpLog.verifiedAt = new Date();
        await otpLog.save();

        console.log(`✅ OTP verified successfully for ${email || mobile}`);

        return {
            success: true,
            message: 'OTP verified successfully'
        };
    } catch (error) {
        console.error('❌ Verify OTP Error:', error);
        throw new Error(`Failed to verify OTP: ${error.message}`);
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    generateOTP
};
