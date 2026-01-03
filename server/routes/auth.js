const express = require('express');
const router = express.Router();
const {
    registerUser,
    registerDoctor,
    verifyOTPHandler,
    resendOTP,
    loginUser,
    loginDoctor,
    loginAdmin,
    requestLoginOTP,
    loginWithOTP
} = require('../controllers/authController');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');

// Registration routes
router.post('/register/user', otpLimiter, (req, res, next) => registerUser(req, res, next));
router.post('/register/doctor', otpLimiter, (req, res, next) => registerDoctor(req, res, next));

// OTP routes
router.post('/verify-otp', (req, res, next) => verifyOTPHandler(req, res, next));
router.post('/resend-otp', otpLimiter, (req, res, next) => resendOTP(req, res, next));
router.post('/request-login-otp', otpLimiter, (req, res, next) => requestLoginOTP(req, res, next));

// Login routes
router.post('/login/user', loginLimiter, (req, res, next) => loginUser(req, res, next));
router.post('/login/doctor', loginLimiter, (req, res, next) => loginDoctor(req, res, next));
router.post('/login/admin', loginLimiter, (req, res, next) => loginAdmin(req, res, next));
router.post('/login-with-otp', loginLimiter, (req, res, next) => loginWithOTP(req, res, next));

module.exports = router;
