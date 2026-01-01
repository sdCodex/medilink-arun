const express = require('express');
const router = express.Router();
const {
    registerUser,
    registerDoctor,
    verifyOTPHandler,
    resendOTP,
    loginUser,
    loginDoctor,
    loginAdmin
} = require('../controllers/authController');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');

// Registration routes
router.post('/register/user', otpLimiter, registerUser);
router.post('/register/doctor', otpLimiter, registerDoctor);

// OTP routes
router.post('/verify-otp', verifyOTPHandler);
router.post('/resend-otp', otpLimiter, resendOTP);

// Login routes
router.post('/login/user', loginLimiter, loginUser);
router.post('/login/doctor', loginLimiter, loginDoctor);
router.post('/login/admin', loginLimiter, loginAdmin);

module.exports = router;
