const mongoose = require('mongoose');

const healthCardSchema = new mongoose.Schema({
    // User Reference
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },

    // Unique Health ID (also stored in User model)
    uniqueHealthId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // QR Code Data
    qrToken: {
        type: String,
        required: true,
        unique: true
    },
    qrCodeImageUrl: {
        type: String // Base64 or URL of QR code image
    },
    qrGeneratedAt: {
        type: Date,
        default: Date.now
    },
    qrExpiresAt: {
        type: Date
        // Optional: Can set expiry for QR tokens if needed for security
    },

    // Card Data Snapshot (at time of generation)
    cardData: {
        name: String,
        dateOfBirth: Date,
        gender: String,
        bloodGroup: String,
        emergencyContact: {
            name: String,
            mobile: String
        },
        address: {
            city: String,
            state: String
        }
    },

    // Card Status
    isActive: {
        type: Boolean,
        default: true
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    revokedAt: {
        type: Date
    },
    revokedReason: {
        type: String
    },

    // Generation Metadata
    generatedAt: {
        type: Date,
        default: Date.now
    },
    lastRegeneratedAt: {
        type: Date
    },
    regenerationCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for QR token lookup (emergency access)
healthCardSchema.index({ qrToken: 1, isActive: 1 });

module.exports = mongoose.model('HealthCard', healthCardSchema);
