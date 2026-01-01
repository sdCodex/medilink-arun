const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const { sendOTP, verifyOTP } = require('../services/otpService');
const { generateToken } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLogger');
const cloudinary = require('../config/cloudinary');

/**
 * @desc    Register User (Patient)
 * @route   POST /api/auth/register/user
 * @access  Public
 */
const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        // Validate required fields
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, email, mobile, password'
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { mobile }] });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or mobile already exists'
            });
        }

        // Create user (password will be hashed by pre-save middleware)
        const user = await User.create({
            name,
            email,
            mobile,
            password
        });

        // Send OTP for verification
        const otpResult = await sendOTP({
            email,
            mobile,
            purpose: 'registration',
            recipientId: user._id,
            recipientModel: 'User',
            name
        });

        // Create audit log
        await createAuditLog({
            actorModel: 'User',
            actorId: user._id,
            actorName: user.name,
            actorEmail: user.email,
            action: 'user_registered',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please verify OTP sent to your email and mobile.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile
            },
            otp: otpResult
        });
    } catch (error) {
        console.error('Register User Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
};

/**
 * @desc    Register Doctor
 * @route   POST /api/auth/register/doctor
 * @access  Public
 */
const registerDoctor = async (req, res) => {
    try {
        const {
            name,
            email,
            mobile,
            password,
            medicalRegistrationNumber,
            specialization,
            hospitalName,
            hospitalAddress,
            governmentId,
            medicalCertificate,
            registrationCertificate
        } = req.body;

        // Validate required fields
        if (!name || !email || !mobile || !password || !medicalRegistrationNumber || !hospitalName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if doctor already exists
        const doctorExists = await Doctor.findOne({
            $or: [{ email }, { mobile }, { medicalRegistrationNumber }]
        });

        if (doctorExists) {
            return res.status(400).json({
                success: false,
                message: 'Doctor with this email, mobile, or registration number already exists'
            });
        }

        // Document URLs should be provided (uploaded via frontend to Cloudinary)
        if (!governmentId || !medicalCertificate) {
            return res.status(400).json({
                success: false,
                message: 'Please upload government ID and medical certificate'
            });
        }

        // Create doctor
        const doctor = await Doctor.create({
            name,
            email,
            mobile,
            password,
            medicalRegistrationNumber,
            specialization,
            hospitalName,
            hospitalAddress,
            documents: {
                governmentId,
                medicalCertificate,
                registrationCertificate
            }
        });

        // Send OTP for verification
        const otpResult = await sendOTP({
            email,
            mobile,
            purpose: 'registration',
            recipientId: doctor._id,
            recipientModel: 'Doctor',
            name
        });

        // Create audit log
        await createAuditLog({
            actorModel: 'Doctor',
            actorId: doctor._id,
            actorName: doctor.name,
            actorEmail: doctor.email,
            action: 'doctor_registered',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                approvalStatus: 'pending'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Doctor registration successful! Please verify OTP. Your account is pending admin approval.',
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                mobile: doctor.mobile,
                approvalStatus: doctor.approvalStatus
            },
            otp: otpResult
        });
    } catch (error) {
        console.error('Register Doctor Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Doctor registration failed'
        });
    }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTPHandler = async (req, res) => {
    try {
        const { email, mobile, otp, purpose } = req.body;

        if (!otp || !purpose) {
            return res.status(400).json({
                success: false,
                message: 'Please provide OTP and purpose'
            });
        }

        if (!email && !mobile) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email or mobile'
            });
        }

        const result = await verifyOTP({ email, mobile, otp, purpose });

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Update user/doctor verification status
        if (purpose === 'registration') {
            if (email) {
                await User.updateOne({ email }, { isEmailVerified: true });
                await Doctor.updateOne({ email }, { isEmailVerified: true });
            }
            if (mobile) {
                await User.updateOne({ mobile }, { isMobileVerified: true });
                await Doctor.updateOne({ mobile }, { isMobileVerified: true });
            }
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'OTP verification failed'
        });
    }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOTP = async (req, res) => {
    try {
        const { email, mobile, purpose } = req.body;

        if (!email && !mobile) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email or mobile'
            });
        }

        if (!purpose) {
            return res.status(400).json({
                success: false,
                message: 'Please provide purpose'
            });
        }

        // Find user or doctor
        let user = await User.findOne({ $or: [{ email }, { mobile }] });
        let doctor = await Doctor.findOne({ $or: [{ email }, { mobile }] });

        const entity = user || doctor;
        if (!entity) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Send new OTP
        const otpResult = await sendOTP({
            email: entity.email,
            mobile: entity.mobile,
            purpose,
            recipientId: entity._id,
            recipientModel: user ? 'User' : 'Doctor',
            name: entity.name
        });

        res.status(200).json({
            success: true,
            message: 'OTP resent successfully',
            otp: otpResult
        });
    } catch (error) {
        console.error('Resend OTP Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to resend OTP'
        });
    }
};

/**
 * @desc    Login User
 * @route   POST /api/auth/login/user
 * @access  Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if email and mobile are verified
        if (!user.isEmailVerified || !user.isMobileVerified) {
            // Send OTP for verification
            await sendOTP({
                email: user.email,
                mobile: user.mobile,
                purpose: 'login',
                recipientId: user._id,
                recipientModel: 'User',
                name: user.name
            });

            return res.status(403).json({
                success: false,
                message: 'Please verify your email and mobile. OTP has been sent.',
                requiresOTP: true
            });
        }

        // Generate JWT token
        const token = generateToken(user._id, 'user');

        // Create audit log
        await createAuditLog({
            actorModel: 'User',
            actorId: user._id,
            actorName: user.name,
            actorEmail: user.email,
            action: 'user_login',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                isProfileComplete: user.isProfileComplete,
                healthCardGenerated: user.healthCardGenerated
            }
        });
    } catch (error) {
        console.error('Login User Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
};

/**
 * @desc    Login Doctor
 * @route   POST /api/auth/login/doctor
 * @access  Public
 */
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find doctor with password
        const doctor = await Doctor.findOne({ email }).select('+password');

        if (!doctor) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await doctor.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if email and mobile are verified
        if (!doctor.isEmailVerified || !doctor.isMobileVerified) {
            // Send OTP
            await sendOTP({
                email: doctor.email,
                mobile: doctor.mobile,
                purpose: 'login',
                recipientId: doctor._id,
                recipientModel: 'Doctor',
                name: doctor.name
            });

            return res.status(403).json({
                success: false,
                message: 'Please verify your email and mobile. OTP has been sent.',
                requiresOTP: true
            });
        }

        // Generate JWT token
        const token = generateToken(doctor._id, 'doctor');

        // Create audit log
        await createAuditLog({
            actorModel: 'Doctor',
            actorId: doctor._id,
            actorName: doctor.name,
            actorEmail: doctor.email,
            action: 'doctor_login',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                approvalStatus: doctor.approvalStatus
            }
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                mobile: doctor.mobile,
                role: doctor.role,
                approvalStatus: doctor.approvalStatus,
                canAccessSystem: doctor.canAccessSystem()
            }
        });
    } catch (error) {
        console.error('Login Doctor Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
};

/**
 * @desc    Login Admin
 * @route   POST /api/auth/login/admin
 * @access  Public
 */
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find admin with password
        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await admin.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = generateToken(admin._id, 'admin');

        // Create audit log
        await createAuditLog({
            actorModel: 'Admin',
            actorId: admin._id,
            actorName: admin.name,
            actorEmail: admin.email,
            action: 'admin_login',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        });
    } catch (error) {
        console.error('Login Admin Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
};

module.exports = {
    registerUser,
    registerDoctor,
    verifyOTPHandler,
    resendOTP,
    loginUser,
    loginDoctor,
    loginAdmin
};
