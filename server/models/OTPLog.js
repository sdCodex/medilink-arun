const mongoose = require('mongoose');

const otpLogSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    mobile: {
        type: String,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['registration', 'login', 'password-reset'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index - MongoDB will automatically delete expired documents
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Create compound index for faster queries
otpLogSchema.index({ email: 1, mobile: 1, purpose: 1, isVerified: 1 });

module.exports = mongoose.model('OTPLog', otpLogSchema);
