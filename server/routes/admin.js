const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getPendingDoctors,
    approveDoctor,
    rejectDoctor,
    revokeDoctor,
    getAllUsers,
    getAllDoctors,
    getAuditLogs
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Doctor management
router.get('/pending-doctors', getPendingDoctors);
router.post('/approve-doctor/:doctorId', approveDoctor);
router.post('/reject-doctor/:doctorId', rejectDoctor);
router.post('/revoke-doctor/:doctorId', revokeDoctor);
router.get('/doctors', getAllDoctors);

// User management
router.get('/users', getAllUsers);

// Audit logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
