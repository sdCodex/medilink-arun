const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    actor: {
        model: {
            type: String,
            enum: ['User', 'Doctor', 'Admin'],
            required: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'actor.model',
            required: true
        },
        name: String,
        email: String
    },

    action: {
        type: String,
        required: true,
        enum: [
            'user_registered',
            'user_login',
            'doctor_registered',
            'doctor_login',
            'doctor_approved',
            'doctor_rejected',
            'doctor_revoked',
            'admin_login',
            'medical_record_updated',
            'disease_verified',
            'allergy_verified',
            'prescription_added',
            'qr_generated',
            'qr_regenerated',
            'qr_disabled',
            'qr_scanned',
            'health_card_generated'
        ]
    },

    target: {
        model: {
            type: String,
            enum: ['User', 'Doctor', 'Admin', 'MedicalRecord', 'HealthCard', 'Notification']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'target.model'
        }
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed
    },

    ipAddress: {
        type: String
    },

    userAgent: {
        type: String
    },

    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    },

    errorMessage: {
        type: String
    }
}, {
    timestamps: true
});

// Create indexes for efficient querying
auditLogSchema.index({ 'actor.id': 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ 'target.id': 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
