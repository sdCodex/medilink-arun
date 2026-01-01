const express = require('express');
const router = express.Router();
const {
    getProfile,
    searchPatients,
    getPatientDetails,
    getDashboard
} = require('../controllers/doctorController');
const { protect, requireDoctor, requireApprovedDoctor } = require('../middleware/auth');

// All routes require authentication and doctor role
router.use(protect, requireDoctor);

// Profile and dashboard (available to all doctors, even pending)
router.get('/profile', getProfile);
router.get('/dashboard', getDashboard);

// Patient access routes (only approved doctors)
router.get('/patients', requireApprovedDoctor, searchPatients);
router.get('/patient/:userId', requireApprovedDoctor, getPatientDetails);

// Medical Record verification routes (only approved doctors)
const doctorMedicalRecordController = require('../controllers/doctorMedicalRecordController');
router.get('/patient/:userId/medical-record', requireApprovedDoctor, doctorMedicalRecordController.getPatientMedicalRecord);
router.post('/verify-disease', requireApprovedDoctor, doctorMedicalRecordController.verifyDisease);
router.post('/verify-allergy', requireApprovedDoctor, doctorMedicalRecordController.verifyAllergy);
router.post('/add-prescription', requireApprovedDoctor, doctorMedicalRecordController.addPrescription);
router.put('/prescription/:prescriptionId/status', requireApprovedDoctor, doctorMedicalRecordController.updatePrescriptionStatus);
router.get('/action-history', requireApprovedDoctor, doctorMedicalRecordController.getActionHistory);

module.exports = router;
