const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');
const { notifyPatientOfDoctorUpdate } = require('../services/notificationService');

/**
 * @desc    Get patient medical record
 * @route   GET /api/doctor/patient/:userId/medical-record
 * @access  Private (Approved Doctor)
 */
const getPatientMedicalRecord = async (req, res) => {
    try {
        const { userId } = req.params;

        const medicalRecord = await MedicalRecord.findOne({ user: userId })
            .populate('user', 'name email mobile bloodGroup')
            .populate('diseases.verifiedBy', 'name specialization')
            .populate('allergies.verifiedBy', 'name specialization')
            .populate('prescriptions.prescribedBy', 'name specialization');

        if (!medicalRecord) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found'
            });
        }

        // Audit log
        await createAuditLog({
            actorModel: 'Doctor',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'patient_medical_record_viewed',
            targetModel: 'MedicalRecord',
            targetId: medicalRecord._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(200).json({
            success: true,
            medicalRecord
        });
    } catch (error) {
        console.error('Get Patient Medical Record Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient medical record'
        });
    }
};

/**
 * @desc    Verify disease
 * @route   POST /api/doctor/verify-disease
 * @access  Private (Approved Doctor)
 */
const verifyDisease = async (req, res) => {
    try {
        const { userId, diseaseName, severity, diagnosedDate, notes } = req.body;

        if (!userId || !diseaseName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user ID and disease name'
            });
        }

        let medicalRecord = await MedicalRecord.findOne({ user: userId });

        if (!medicalRecord) {
            medicalRecord = await MedicalRecord.create({ user: userId });
        }

        // Find disease in record
        const disease = medicalRecord.diseases.find(d =>
            d.name.toLowerCase() === diseaseName.toLowerCase()
        );

        if (disease) {
            // Update existing disease
            disease.isDoctorVerified = true;
            disease.verifiedBy = req.user._id;
            disease.verifiedAt = new Date();
            if (severity) disease.severity = severity;
            if (diagnosedDate) disease.diagnosedDate = diagnosedDate;
            if (notes) disease.notes = notes;
        } else {
            // Add new verified disease
            medicalRecord.diseases.push({
                name: diseaseName,
                isSelfReported: false,
                isDoctorVerified: true,
                verifiedBy: req.user._id,
                verifiedAt: new Date(),
                severity,
                diagnosedDate,
                notes
            });
        }

        // Update verification status
        medicalRecord.updateVerificationStatus();
        medicalRecord.lastVerifiedBy = req.user._id;
        medicalRecord.lastVerifiedAt = new Date();

        // Add version history
        medicalRecord.addVersionHistory(
            disease ? 'disease_verified' : 'disease_added',
            {
                model: 'Doctor',
                id: req.user._id,
                name: req.user.name
            },
            { disease: diseaseName, severity },
            `Disease ${disease ? 'verified' : 'confirmed'} by Dr. ${req.user.name}`
        );

        await medicalRecord.save();

        // Get patient details
        const patient = await User.findById(userId);

        // Send notification to patient
        await notifyPatientOfDoctorUpdate({
            patient,
            doctor: req.user,
            action: 'Disease Verified',
            details: `Confirmed: ${diseaseName}${severity ? ` (${severity})` : ''}`
        });

        // Audit log
        await createAuditLog({
            actorModel: 'Doctor',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'disease_verified',
            targetModel: 'MedicalRecord',
            targetId: medicalRecord._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                patientId: userId,
                patientName: patient.name,
                disease: diseaseName,
                severity
            }
        });

        res.status(200).json({
            success: true,
            message: 'Disease verified successfully',
            disease: medicalRecord.diseases.find(d => d.name.toLowerCase() === diseaseName.toLowerCase())
        });
    } catch (error) {
        console.error('Verify Disease Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify disease'
        });
    }
};

/**
 * @desc    Verify allergy
 * @route   POST /api/doctor/verify-allergy
 * @access  Private (Approved Doctor)
 */
const verifyAllergy = async (req, res) => {
    try {
        const { userId, allergyName, severity, reaction, notes } = req.body;

        if (!userId || !allergyName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user ID and allergy name'
            });
        }

        let medicalRecord = await MedicalRecord.findOne({ user: userId });

        if (!medicalRecord) {
            medicalRecord = await MedicalRecord.create({ user: userId });
        }

        // Find allergy in record
        const allergy = medicalRecord.allergies.find(a =>
            a.name.toLowerCase() === allergyName.toLowerCase()
        );

        if (allergy) {
            // Update existing allergy
            allergy.isDoctorVerified = true;
            allergy.verifiedBy = req.user._id;
            allergy.verifiedAt = new Date();
            if (severity) allergy.severity = severity;
            if (reaction) allergy.reaction = reaction;
            if (notes) allergy.notes = notes;
        } else {
            // Add new verified allergy
            medicalRecord.allergies.push({
                name: allergyName,
                isSelfReported: false,
                isDoctorVerified: true,
                verifiedBy: req.user._id,
                verifiedAt: new Date(),
                severity,
                reaction,
                notes
            });
        }

        // Update verification status
        medicalRecord.updateVerificationStatus();
        medicalRecord.lastVerifiedBy = req.user._id;
        medicalRecord.lastVerifiedAt = new Date();

        // Add version history
        medicalRecord.addVersionHistory(
            allergy ? 'allergy_verified' : 'allergy_added',
            {
                model: 'Doctor',
                id: req.user._id,
                name: req.user.name
            },
            { allergy: allergyName, severity },
            `Allergy ${allergy ? 'verified' : 'confirmed'} by Dr. ${req.user.name}`
        );

        await medicalRecord.save();

        // Get patient details
        const patient = await User.findById(userId);

        // Send notification to patient
        await notifyPatientOfDoctorUpdate({
            patient,
            doctor: req.user,
            action: 'Allergy Verified',
            details: `Confirmed: ${allergyName}${severity ? ` (${severity})` : ''}`
        });

        // Audit log
        await createAuditLog({
            actorModel: 'Doctor',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'allergy_verified',
            targetModel: 'MedicalRecord',
            targetId: medicalRecord._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                patientId: userId,
                patientName: patient.name,
                allergy: allergyName,
                severity
            }
        });

        res.status(200).json({
            success: true,
            message: 'Allergy verified successfully',
            allergy: medicalRecord.allergies.find(a => a.name.toLowerCase() === allergyName.toLowerCase())
        });
    } catch (error) {
        console.error('Verify Allergy Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify allergy'
        });
    }
};

/**
 * @desc    Add prescription
 * @route   POST /api/doctor/add-prescription
 * @access  Private (Approved Doctor)
 */
const addPrescription = async (req, res) => {
    try {
        const { userId, medicationName, dosage, frequency, duration, notes } = req.body;

        if (!userId || !medicationName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user ID and medication name'
            });
        }

        let medicalRecord = await MedicalRecord.findOne({ user: userId });

        if (!medicalRecord) {
            medicalRecord = await MedicalRecord.create({ user: userId });
        }

        // Add prescription
        medicalRecord.prescriptions.push({
            medicationName,
            dosage,
            frequency,
            duration,
            notes,
            prescribedBy: req.user._id,
            prescribedAt: new Date(),
            isActive: true
        });

        // Update verification status
        medicalRecord.updateVerificationStatus();
        medicalRecord.lastVerifiedBy = req.user._id;
        medicalRecord.lastVerifiedAt = new Date();

        // Add version history
        medicalRecord.addVersionHistory(
            'prescription_added',
            {
                model: 'Doctor',
                id: req.user._id,
                name: req.user.name
            },
            { medication: medicationName, dosage, frequency },
            `Prescription added by Dr. ${req.user.name}`
        );

        await medicalRecord.save();

        // Get patient details
        const patient = await User.findById(userId);

        // Send notification to patient
        await notifyPatientOfDoctorUpdate({
            patient,
            doctor: req.user,
            action: 'Prescription Added',
            details: `${medicationName} - ${dosage || ''} ${frequency || ''}`
        });

        // Audit log
        await createAuditLog({
            actorModel: 'Doctor',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'prescription_added',
            targetModel: 'MedicalRecord',
            targetId: medicalRecord._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                patientId: userId,
                patientName: patient.name,
                medication: medicationName
            }
        });

        res.status(201).json({
            success: true,
            message: 'Prescription added successfully',
            prescription: medicalRecord.prescriptions[medicalRecord.prescriptions.length - 1]
        });
    } catch (error) {
        console.error('Add Prescription Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add prescription'
        });
    }
};

/**
 * @desc    Update prescription status
 * @route   PUT /api/doctor/prescription/:prescriptionId/status
 * @access  Private (Approved Doctor)
 */
const updatePrescriptionStatus = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const { isActive } = req.body;

        const medicalRecord = await MedicalRecord.findOne({
            'prescriptions._id': prescriptionId
        });

        if (!medicalRecord) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        const prescription = medicalRecord.prescriptions.id(prescriptionId);
        prescription.isActive = isActive;

        // Add version history
        medicalRecord.addVersionHistory(
            'prescription_updated',
            {
                model: 'Doctor',
                id: req.user._id,
                name: req.user.name
            },
            { medication: prescription.medicationName, isActive },
            `Prescription ${isActive ? 'activated' : 'deactivated'} by Dr. ${req.user.name}`
        );

        await medicalRecord.save();

        res.status(200).json({
            success: true,
            message: 'Prescription updated successfully',
            prescription
        });
    } catch (error) {
        console.error('Update Prescription Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update prescription'
        });
    }
};

/**
 * @desc    Get doctor's action history
 * @route   GET /api/doctor/action-history
 * @access  Private (Approved Doctor)
 */
const getActionHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Find all medical records where doctor has performed actions
        const medicalRecords = await MedicalRecord.find({
            $or: [
                { 'diseases.verifiedBy': req.user._id },
                { 'allergies.verifiedBy': req.user._id },
                { 'prescriptions.prescribedBy': req.user._id }
            ]
        })
            .populate('user', 'name email mobile')
            .sort({ 'versionHistory.performedAt': -1 })
            .skip(skip)
            .limit(limit);

        // Extract actions performed by this doctor
        const actions = [];
        medicalRecords.forEach(record => {
            record.versionHistory.forEach(history => {
                if (history.performedBy.id.toString() === req.user._id.toString()) {
                    actions.push({
                        patient: record.user,
                        action: history.action,
                        changes: history.changes,
                        notes: history.notes,
                        performedAt: history.performedAt
                    });
                }
            });
        });

        // Sort by date
        actions.sort((a, b) => b.performedAt - a.performedAt);

        res.status(200).json({
            success: true,
            count: actions.length,
            actions: actions.slice(0, limit)
        });
    } catch (error) {
        console.error('Get Action History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch action history'
        });
    }
};

module.exports = {
    getPatientMedicalRecord,
    verifyDisease,
    verifyAllergy,
    addPrescription,
    updatePrescriptionStatus,
    getActionHistory
};
