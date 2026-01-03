const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    mobile: {
        type: String,
        required: [true, 'Please provide your mobile number'],
        unique: true,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid mobile number']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
    },

    // Professional Credentials
    medicalRegistrationNumber: {
        type: String,
        required: [true, 'Please provide your medical registration number'],
        unique: true,
        trim: true
    },
    specialization: {
        type: String,
        trim: true
    },
    hospitalName: {
        type: String,
        required: [true, 'Please provide your hospital/clinic name'],
        trim: true
    },
    hospitalAddress: {
        type: String,
        default: 'N/A'
    },

    // Document Uploads (Cloudinary URLs)
    documents: {
        governmentId: {
            type: String,
            required: [true, 'Please upload government ID']
        },
        medicalCertificate: {
            type: String,
            required: [true, 'Please upload medical certificate']
        },
        registrationCertificate: {
            type: String
        }
    },

    // Verification Status
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isMobileVerified: {
        type: Boolean,
        default: false
    },

    // Admin Actions
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    approvedAt: {
        type: Date
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    rejectedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    },

    // Role
    role: {
        type: String,
        default: 'doctor'
    },

    // Account Status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
doctorSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
doctorSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if doctor is approved and can access system
doctorSchema.methods.canAccessSystem = function () {
    return this.approvalStatus === 'approved' && this.isActive;
};

module.exports = mongoose.model('Doctor', doctorSchema);
