const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');

/**
 * Protect routes - Require JWT authentication
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Check if token exists in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. Please login.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user based on role
            let user;
            switch (decoded.role) {
                case 'user':
                    user = await User.findById(decoded.id).select('-password');
                    break;
                case 'doctor':
                    user = await Doctor.findById(decoded.id).select('-password');
                    break;
                case 'admin':
                    user = await Admin.findById(decoded.id).select('-password');
                    break;
                default:
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid user role'
                    });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if account is active
            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact support.'
                });
            }

            // Attach user to request
            req.user = user;
            req.userRole = decoded.role;

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token. Please login again.'
            });
        }
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

/**
 * Require User role
 */
const requireUser = (req, res, next) => {
    if (req.userRole !== 'user') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. User role required.'
        });
    }
    next();
};

/**
 * Require Doctor role
 */
const requireDoctor = (req, res, next) => {
    if (req.userRole !== 'doctor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Doctor role required.'
        });
    }
    next();
};

/**
 * Require Admin role
 */
const requireAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }
    next();
};

/**
 * Require Approved Doctor
 * Doctor must be approved by admin to access certain routes
 */
const requireApprovedDoctor = (req, res, next) => {
    if (req.userRole !== 'doctor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Doctor role required.'
        });
    }

    if (req.user.approvalStatus !== 'approved') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Your account is pending admin approval.',
            approvalStatus: req.user.approvalStatus
        });
    }

    next();
};

/**
 * Generate JWT token
 */
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

module.exports = {
    protect,
    requireUser,
    requireDoctor,
    requireAdmin,
    requireApprovedDoctor,
    generateToken
};
