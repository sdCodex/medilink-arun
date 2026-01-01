const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    // Patient Reference
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Diseases
    diseases: [{
        name: {
            type: String,
            required: true
        },
        isSelfReported: {
            type: Boolean,
            default: true
        },
        isDoctorVerified: {
            type: Boolean,
            default: false
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        },
        verifiedAt: {
            type: Date
        },
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe', 'critical']
        },
        diagnosedDate: {
            type: Date
        },
        notes: String
    }],

    // Allergies
    allergies: [{
        name: {
            type: String,
            required: true
        },
        isSelfReported: {
            type: Boolean,
            default: true
        },
        isDoctorVerified: {
            type: Boolean,
            default: false
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        },
        verifiedAt: {
            type: Date
        },
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe', 'life-threatening']
        },
        reaction: String,
        notes: String
    }],

    // Prescriptions
    prescriptions: [{
        medicationName: {
            type: String,
            required: true
        },
        dosage: String,
        frequency: String,
        duration: String,
        prescribedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true
        },
        prescribedAt: {
            type: Date,
            default: Date.now
        },
        notes: String,
        isActive: {
            type: Boolean,
            default: true
        }
    }],

    // Medical Reports (Uploaded files)
    uploadedReports: [{
        fileName: {
            type: String,
            required: true
        },
        fileType: String,
        fileUrl: {
            type: String,
            required: true // Cloudinary URL
        },
        cloudinaryPublicId: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        uploadedBy: {
            model: {
                type: String,
                enum: ['User', 'Doctor']
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'uploadedReports.uploadedBy.model'
            }
        },
        reportType: {
            type: String,
            enum: ['lab-test', 'x-ray', 'mri', 'ct-scan', 'prescription', 'discharge-summary', 'other']
        },
        description: String
    }],

    // Version History
    versionHistory: [{
        action: {
            type: String,
            enum: [
                'disease_added',
                'disease_verified',
                'disease_updated',
                'allergy_added',
                'allergy_verified',
                'allergy_updated',
                'prescription_added',
                'prescription_updated',
                'report_uploaded',
                'record_created'
            ],
            required: true
        },
        performedBy: {
            model: {
                type: String,
                enum: ['User', 'Doctor', 'Admin']
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'versionHistory.performedBy.model'
            },
            name: String
        },
        performedAt: {
            type: Date,
            default: Date.now
        },
        changes: {
            type: mongoose.Schema.Types.Mixed
        },
        notes: String
    }],

    // Verification Status
    hasVerifiedData: {
        type: Boolean,
        default: false
    },
    lastVerifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    lastVerifiedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
medicalRecordSchema.index({ user: 1, createdAt: -1 });
medicalRecordSchema.index({ 'diseases.isDoctorVerified': 1 });
medicalRecordSchema.index({ 'allergies.isDoctorVerified': 1 });

// Method to add version history
medicalRecordSchema.methods.addVersionHistory = function (action, performedBy, changes, notes) {
    this.versionHistory.push({
        action,
        performedBy,
        performedAt: new Date(),
        changes,
        notes
    });
};

// Method to check if record has any verified data
medicalRecordSchema.methods.updateVerificationStatus = function () {
    const hasVerifiedDiseases = this.diseases.some(d => d.isDoctorVerified);
    const hasVerifiedAllergies = this.allergies.some(a => a.isDoctorVerified);
    const hasPrescriptions = this.prescriptions.length > 0;

    this.hasVerifiedData = hasVerifiedDiseases || hasVerifiedAllergies || hasPrescriptions;
    return this.hasVerifiedData;
};

// Method to get verified data only (for emergency QR)
medicalRecordSchema.methods.getVerifiedDataOnly = function () {
    return {
        diseases: this.diseases.filter(d => d.isDoctorVerified),
        allergies: this.allergies.filter(a => a.isDoctorVerified),
        prescriptions: this.prescriptions.filter(p => p.isActive)
    };
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
