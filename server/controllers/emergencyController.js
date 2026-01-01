const MedicalRecord = require('../models/MedicalRecord');
const HealthCard = require('../models/HealthCard');
const User = require('../models/User');
const { verifyQRToken } = require('../services/qrService');
const { createAuditLog } = require('../middleware/auditLogger');

/**
 * @desc    Emergency access via QR scan
 * @route   POST /api/emergency/scan-qr
 * @access  Public (No authentication required)
 */
const scanQR = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Please provide QR token'
            });
        }

        // Verify QR token
        const verification = verifyQRToken(token);

        if (!verification.success) {
            return res.status(401).json({
                success: false,
                message: verification.message
            });
        }

        const { userId, healthId } = verification.data;

        // Find health card
        const healthCard = await HealthCard.findOne({
            uniqueHealthId: healthId,
            isActive: true
        });

        if (!healthCard) {
            return res.status(404).json({
                success: false,
                message: 'Health card not found or has been disabled'
            });
        }

        // Get user details
        const user = await User.findById(userId).select('name dateOfBirth gender bloodGroup emergencyContact');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get medical record with VERIFIED data only
        const medicalRecord = await MedicalRecord.findOne({ user: userId })
            .populate('diseases.verifiedBy', 'name specialization')
            .populate('allergies.verifiedBy', 'name specialization')
            .populate('prescriptions.prescribedBy', 'name specialization');

        let emergencyData = {
            // Basic Info
            name: user.name,
            age: user.dateOfBirth ? Math.floor((new Date() - new Date(user.dateOfBirth)) / 31557600000) : null,
            gender: user.gender,
            bloodGroup: user.bloodGroup,

            // Emergency Contact
            emergencyContact: user.emergencyContact,

            // Medical Info (VERIFIED ONLY)
            verifiedDiseases: [],
            verifiedAllergies: [],
            activePrescriptions: [],

            // Verification Info
            lastVerifiedAt: null,
            lastVerifiedBy: null
        };

        if (medicalRecord) {
            // Get only doctor-verified diseases
            emergencyData.verifiedDiseases = medicalRecord.diseases
                .filter(d => d.isDoctorVerified)
                .map(d => ({
                    name: d.name,
                    severity: d.severity,
                    diagnosedDate: d.diagnosedDate,
                    verifiedBy: d.verifiedBy ? {
                        name: d.verifiedBy.name,
                        specialization: d.verifiedBy.specialization
                    } : null,
                    verifiedAt: d.verifiedAt
                }));

            // Get only doctor-verified allergies
            emergencyData.verifiedAllergies = medicalRecord.allergies
                .filter(a => a.isDoctorVerified)
                .map(a => ({
                    name: a.name,
                    severity: a.severity,
                    reaction: a.reaction,
                    verifiedBy: a.verifiedBy ? {
                        name: a.verifiedBy.name,
                        specialization: a.verifiedBy.specialization
                    } : null,
                    verifiedAt: a.verifiedAt
                }));

            // Get active prescriptions
            emergencyData.activePrescriptions = medicalRecord.prescriptions
                .filter(p => p.isActive)
                .map(p => ({
                    medicationName: p.medicationName,
                    dosage: p.dosage,
                    frequency: p.frequency,
                    prescribedBy: p.prescribedBy ? {
                        name: p.prescribedBy.name,
                        specialization: p.prescribedBy.specialization
                    } : null,
                    prescribedAt: p.prescribedAt
                }));

            emergencyData.lastVerifiedAt = medicalRecord.lastVerifiedAt;
            if (medicalRecord.lastVerifiedBy) {
                const lastDoctor = await require('../models/Doctor').findById(medicalRecord.lastVerifiedBy);
                if (lastDoctor) {
                    emergencyData.lastVerifiedBy = lastDoctor.name;
                }
            }
        }

        // Audit log (optional - may want to notify user of QR scan)
        await createAuditLog({
            actorModel: 'User', // Unknown scanner, using User as placeholder
            actorId: userId,
            action: 'qr_scanned',
            targetModel: 'HealthCard',
            targetId: healthCard._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                healthId: healthCard.uniqueHealthId,
                hasVerifiedData: emergencyData.verifiedDiseases.length > 0 || emergencyData.verifiedAllergies.length > 0
            }
        });

        console.log(`🚨 QR scanned for ${user.name} (${healthCard.uniqueHealthId})`);

        res.status(200).json({
            success: true,
            message: 'Emergency data retrieved successfully',
            data: emergencyData,
            scannedAt: new Date()
        });
    } catch (error) {
        console.error('Scan QR Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to scan QR code'
        });
    }
};

module.exports = {
    scanQR
};
