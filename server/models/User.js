const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
        select: false // Don't return password by default
    },

    // Personal Details
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String
    },

    // Emergency Contact
    emergencyContact: {
        name: String,
        relationship: String,
        mobile: String,
        email: String
    },

    // Health Information (Self-reported)
    selfReportedDiseases: [{
        type: String
    }],
    selfReportedAllergies: [{
        type: String
    }],

    // Verification Status
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isMobileVerified: {
        type: Boolean,
        default: false
    },
    isProfileComplete: {
        type: Boolean,
        default: false
    },

    // Health Card
    healthCardGenerated: {
        type: Boolean,
        default: false
    },
    healthCardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthCard'
    },
    uniqueHealthId: {
        type: String,
        unique: true,
        sparse: true // Allow null values but ensure uniqueness when present
    },

    // Role
    role: {
        type: String,
        default: 'user'
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
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate unique Health ID
userSchema.methods.generateHealthId = function () {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.uniqueHealthId = `MED-${timestamp}-${randomStr}`;
    return this.uniqueHealthId;
};

// Check if profile is complete
userSchema.methods.checkProfileComplete = function () {
    const required = [
        this.name,
        this.email,
        this.mobile,
        this.dateOfBirth,
        this.gender,
        this.bloodGroup,
        this.emergencyContact?.name,
        this.emergencyContact?.mobile
    ];

    this.isProfileComplete = required.every(field => field !== undefined && field !== null && field !== '');
    return this.isProfileComplete;
};

module.exports = mongoose.model('User', userSchema);
