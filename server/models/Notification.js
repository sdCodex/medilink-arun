const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        model: {
            type: String,
            enum: ['User', 'Doctor', 'Admin'],
            required: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'recipient.model',
            required: true
        },
        email: String,
        mobile: String
    },

    type: {
        type: String,
        enum: ['sms', 'email', 'whatsapp', 'in-app'],
        required: true
    },

    isRead: {
        type: Boolean,
        default: false
    },

    subject: {
        type: String
    },

    content: {
        type: String,
        required: true
    },

    purpose: {
        type: String,
        enum: [
            'otp',
            'registration_confirmation',
            'doctor_approval',
            'doctor_rejection',
            'medical_record_update',
            'emergency_alert',
            'qr_regenerated'
        ],
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },

    sentAt: {
        type: Date
    },

    failureReason: {
        type: String
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Create indexes
notificationSchema.index({ 'recipient.id': 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ purpose: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
