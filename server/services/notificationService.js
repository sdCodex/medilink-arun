const twilio = require('twilio');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

// Initialize Twilio client
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
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
}

/**
 * Send SMS via Twilio
 */
const sendSMS = async ({ mobile, message, recipientId, recipientModel, purpose }) => {
    try {
        if (!twilioClient) {
            console.log(`📱 [DEV MODE] SMS to ${mobile}: ${message}`);

            // Log notification
            await Notification.create({
                recipient: { model: recipientModel, id: recipientId, mobile },
                type: 'sms',
                content: message,
                purpose,
                status: 'sent',
                sentAt: new Date(),
                metadata: { devMode: true }
            });

            return { success: true, message: 'SMS logged (development mode)' };
        }

        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: mobile
        });

        // Log notification
        await Notification.create({
            recipient: { model: recipientModel, id: recipientId, mobile },
            type: 'sms',
            content: message,
            purpose,
            status: 'sent',
            sentAt: new Date(),
            metadata: { messageId: result.sid }
        });

        console.log(`✅ SMS sent to ${mobile}: ${result.sid}`);
        return { success: true, messageId: result.sid };
    } catch (error) {
        console.error(`❌ SMS Error:`, error.message);

        // Log failed notification
        await Notification.create({
            recipient: { model: recipientModel, id: recipientId, mobile },
            type: 'sms',
            content: message,
            purpose,
            status: 'failed',
            failureReason: error.message
        });

        throw error;
    }
};

/**
 * Send WhatsApp message via Twilio
 */
const sendWhatsApp = async ({ mobile, message, recipientId, recipientModel, purpose }) => {
    try {
        if (!twilioClient) {
            console.log(`📱 [DEV MODE] WhatsApp to ${mobile}: ${message}`);

            // Log notification
            await Notification.create({
                recipient: { model: recipientModel, id: recipientId, mobile },
                type: 'whatsapp',
                content: message,
                purpose,
                status: 'sent',
                sentAt: new Date(),
                metadata: { devMode: true }
            });

            return { success: true, message: 'WhatsApp logged (development mode)' };
        }

        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${mobile}`
        });

        // Log notification
        await Notification.create({
            recipient: { model: recipientModel, id: recipientId, mobile },
            type: 'whatsapp',
            content: message,
            purpose,
            status: 'sent',
            sentAt: new Date(),
            metadata: { messageId: result.sid }
        });

        console.log(`✅ WhatsApp sent to ${mobile}: ${result.sid}`);
        return { success: true, messageId: result.sid };
    } catch (error) {
        console.error(`❌ WhatsApp Error:`, error.message);

        // Log failed notification
        await Notification.create({
            recipient: { model: recipientModel, id: recipientId, mobile },
            type: 'whatsapp',
            content: message,
            purpose,
            status: 'failed',
            failureReason: error.message
        });

        throw error;
    }
};

/**
 * Send Email via Nodemailer
 */
const sendEmail = async ({ email, subject, htmlContent, recipientId, recipientModel, purpose }) => {
    try {
        if (!emailTransporter) {
            console.log(`📧 [DEV MODE] Email to ${email}: ${subject}`);

            // Log notification
            await Notification.create({
                recipient: { model: recipientModel, id: recipientId, email },
                type: 'email',
                subject,
                content: htmlContent,
                purpose,
                status: 'sent',
                sentAt: new Date(),
                metadata: { devMode: true }
            });

            return { success: true, message: 'Email logged (development mode)' };
        }

        const mailOptions = {
            from: `"MedLink" <${process.env.SMTP_USER}>`,
            to: email,
            subject,
            html: htmlContent
        };

        const info = await emailTransporter.sendMail(mailOptions);

        // Log notification
        await Notification.create({
            recipient: { model: recipientModel, id: recipientId, email },
            type: 'email',
            subject,
            content: htmlContent,
            purpose,
            status: 'sent',
            sentAt: new Date(),
            metadata: { messageId: info.messageId }
        });

        console.log(`✅ Email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Email Error:`, error.message);

        // Log failed notification
        await Notification.create({
            recipient: { model: recipientModel, id: recipientId, email },
            type: 'email',
            subject,
            content: htmlContent,
            purpose,
            status: 'failed',
            failureReason: error.message
        });

        throw error;
    }
};

/**
 * Send In-App notification and emit real-time event
 */
const sendInAppNotification = async ({ recipientId, recipientModel, title, content, purpose, metadata = {} }) => {
    const { emitNotification } = require('../config/socket');

    try {
        // Create notification in DB
        const notification = await Notification.create({
            recipient: { model: recipientModel, id: recipientId },
            type: 'in-app',
            subject: title,
            content,
            purpose,
            status: 'sent',
            sentAt: new Date(),
            metadata
        });

        // Emit real-time event
        emitNotification(recipientId, notification);

        return { success: true, notification };
    } catch (error) {
        console.error('❌ In-App Notification Error:', error.message);
        throw error;
    }
};

/**
 * Send doctor update notification to patient
 */
const notifyPatientOfDoctorUpdate = async ({ patient, doctor, action, details }) => {
    const { name, email, mobile, _id } = patient;
    const doctorName = doctor.name;

    const message = `Dr. ${doctorName} has updated your medical record: ${action}. ${details}. Login to MedLink to view details.`;

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 MedLink</h1>
          <p>Medical Record Update</p>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <div class="alert-box">
            <p><strong>Dr. ${doctorName}</strong> has updated your medical record.</p>
            <p><strong>Action:</strong> ${action}</p>
            <p><strong>Details:</strong> ${details}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Please login to your MedLink account to view the complete details.</p>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MedLink. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    // Send WhatsApp, Email and In-App
    const results = await Promise.allSettled([
        sendWhatsApp({
            mobile,
            message,
            recipientId: _id,
            recipientModel: 'User',
            purpose: 'medical_record_update'
        }),
        sendEmail({
            email,
            subject: 'Medical Record Updated by Doctor',
            htmlContent: emailHtml,
            recipientId: _id,
            recipientModel: 'User',
            purpose: 'medical_record_update'
        }),
        sendInAppNotification({
            recipientId: _id,
            recipientModel: 'User',
            title: 'Medical Record Updated',
            content: `Dr. ${doctorName} updated your record: ${action}`,
            purpose: 'medical_record_update',
            metadata: { doctorId: doctor._id, action }
        })
    ]);

    console.log(`✅ Patient notification sent to ${name}`);
    return results;
};

module.exports = {
    sendSMS,
    sendWhatsApp,
    sendEmail,
    sendInAppNotification,
    notifyPatientOfDoctorUpdate
};
