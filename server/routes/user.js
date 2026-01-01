const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    updateEmergencyContact,
    addMedicalHistory,
    getDashboard
} = require('../controllers/userController');
const { protect, requireUser } = require('../middleware/auth');

// All routes require authentication and user role
router.use(protect, requireUser);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Emergency contact
router.post('/emergency-contact', updateEmergencyContact);

// Medical history
router.post('/medical-history', addMedicalHistory);

// Dashboard
router.get('/dashboard', getDashboard);

// Medical Record routes
const medicalRecordController = require('../controllers/medicalRecordController');
router.get('/medical-record', medicalRecordController.getMedicalRecord);
router.post('/medical-record/disease', medicalRecordController.addDisease);
router.post('/medical-record/allergy', medicalRecordController.addAllergy);
router.post('/medical-record/upload-report', medicalRecordController.uploadReport);
router.delete('/medical-record/report/:reportId', medicalRecordController.deleteReport);
router.get('/medical-record/timeline', medicalRecordController.getTimeline);

// Health Card routes
const healthCardController = require('../controllers/healthCardController');
router.get('/health-card/eligibility', healthCardController.getEligibility);
router.post('/health-card/generate', healthCardController.generateCard);
router.get('/health-card', healthCardController.getCard);
router.post('/health-card/regenerate-qr', healthCardController.regenerateQRCode);
router.post('/health-card/disable', healthCardController.disableCard);
router.get('/health-card/download-data', healthCardController.getDownloadData);

// Notification routes
const notificationController = require('../controllers/notificationController');
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllRead);
router.delete('/notifications/:id', notificationController.deleteNotification);

module.exports = router;
