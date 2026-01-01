const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const { uploadBase64ToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { createAuditLog } = require('../middleware/auditLogger');

/**
 * @desc    Get or create user medical record
 * @route   GET /api/user/medical-record
 * @access  Private (User)
 */
const getMedicalRecord = async (req, res) => {
    try {
        let medicalRecord = await MedicalRecord.findOne({ user: req.user._id })
            .populate('diseases.verifiedBy', 'name specialization')
            .populate('allergies.verifiedBy', 'name specialization')
            .populate('prescriptions.prescribedBy', 'name specialization');

        // Create if doesn't exist
        if (!medicalRecord) {
            medicalRecord = await MedicalRecord.create({
                user: req.user._id,
                versionHistory: [{
                    action: 'record_created',
                    performedBy: {
                        model: 'User',
                        id: req.user._id,
                        name: req.user.name
                    }
                }]
            });
        }

        res.status(200).json({
            success: true,
            medicalRecord
        });
    } catch (error) {
        console.error('Get Medical Record Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medical record'
        });
    }
};

/**
 * @desc    Add self-reported disease
 * @route   POST /api/user/medical-record/disease
 * @access  Private (User)
 */
const addDisease = async (req, res) => {
    try {
        const { name, diagnosedDate, notes } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide disease name'
            });
        }

        let medicalRecord = await MedicalRecord.findOne({ user: req.user._id });

        if (!medicalRecord) {
            medicalRecord = await MedicalRecord.create({ user: req.user._id });
        }

        // Check if disease already exists
        const existingDisease = medicalRecord.diseases.find(d =>
            d.name.toLowerCase() === name.toLowerCase()
        );

        if (existingDisease) {
            return res.status(400).json({
                success: false,
                message: 'This disease is already in your medical record'
            });
        }

        // Add disease
        medicalRecord.diseases.push({
            name,
            diagnosedDate,
            notes,
            isSelfReported: true,
            isDoctorVerified: false
        });

        // Add version history
        medicalRecord.addVersionHistory(
            'disease_added',
            {
                model: 'User',
                id: req.user._id,
                name: req.user.name
            },
            { disease: name },
            'Self-reported disease added'
        );

        await medicalRecord.save();

        // Update user schema as well
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { selfReportedDiseases: name }
        });

        // Audit log
        await createAuditLog({
            actorModel: 'User',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'medical_history_added',
            targetModel: 'MedicalRecord',
            targetId: medicalRecord._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { disease: name }
        });

        res.status(201).json({
            success: true,
            message: 'Disease added successfully',
            disease: medicalRecord.diseases[medicalRecord.diseases.length - 1]
        });
    } catch (error) {
        console.error('Add Disease Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add disease'
        });
    }
};

/**
 * @desc    Add self-reported allergy
 * @route   POST /api/user/medical-record/allergy
 * @access  Private (User)
 */
const addAllergy = async (req, res) => {
    try {
        const { name, reaction, notes } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide allergy name'
            });
        }

        let medicalRecord = await MedicalRecord.findOne({ user: req.user._id });

        if (!medicalRecord) {
            medicalRecord = await MedicalRecord.create({ user: req.user._id });
        }

        // Check if allergy already exists
        const existingAllergy = medicalRecord.allergies.find(a =>
            a.name.toLowerCase() === name.toLowerCase()
        );

        if (existingAllergy) {
            return res.status(400).json({
                success: false,
                message: 'This allergy is already in your medical record'
            });
        }

        // Add allergy
        medicalRecord.allergies.push({
            name,
            reaction,
            notes,
            isSelfReported: true,
            isDoctorVerified: false
        });

        // Add version history
        medicalRecord.addVersionHistory(
            'allergy_added',
            {
                model: 'User',
                id: req.user._id,
                name: req.user.name
            },
            { allergy: name },
            'Self-reported allergy added'
        );

        await medicalRecord.save();

        // Update user schema
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { selfReportedAllergies: name }
        });

        // Audit log
        await createAuditLog({
            actorModel: 'User',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'medical_history_added',
            targetModel: 'MedicalRecord',
            targetId: medicalRecord._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { allergy: name }
        });

        res.status(201).json({
            success: true,
            message: 'Allergy added successfully',
            allergy: medicalRecord.allergies[medicalRecord.allergies.length - 1]
        });
    } catch (error) {
        console.error('Add Allergy Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add allergy'
        });
    }
};

/**
 * @desc    Upload medical report
 * @route   POST /api/user/medical-record/upload-report
 * @access  Private (User)
 */
const uploadReport = async (req, res) => {
    try {
        const { fileName, fileBase64, reportType, description } = req.body;

        if (!fileName || !fileBase64) {
            return res.status(400).json({
                success: false,
                message: 'Please provide file name and file data (base64)'
            });
        }

        let medicalRecord = await MedicalRecord.findOne({ user: req.user._id });

        if (!medicalRecord) {
            medicalRecord = await MedicalRecord.create({ user: req.user._id });
        }

        // Upload to Cloudinary
        console.log(`📤 Uploading file: ${fileName}`);
        const uploadResult = await uploadBase64ToCloudinary(fileBase64, fileName, 'medical-reports');

        // Add to medical record
        medicalRecord.uploadedReports.push({
            fileName,
            fileType: uploadResult.format,
            fileUrl: uploadResult.url,
            cloudinaryPublicId: uploadResult.publicId,
            uploadedBy: {
                model: 'User',
                id: req.user._id
            },
            reportType: reportType || 'other',
            description
        });

        // Add version history
        medicalRecord.addVersionHistory(
            'report_uploaded',
            {
                model: 'User',
                id: req.user._id,
                name: req.user.name
            },
            { fileName, reportType },
            'Medical report uploaded by user'
        );

        await medicalRecord.save();

        // Audit log
        await createAuditLog({
            actorModel: 'User',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'report_uploaded',
            targetModel: 'MedicalRecord',
            targetId: medicalRecord._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { fileName, reportType }
        });

        res.status(201).json({
            success: true,
            message: 'Medical report uploaded successfully',
            report: medicalRecord.uploadedReports[medicalRecord.uploadedReports.length - 1]
        });
    } catch (error) {
        console.error('Upload Report Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload medical report'
        });
    }
};

/**
 * @desc    Delete uploaded report
 * @route   DELETE /api/user/medical-record/report/:reportId
 * @access  Private (User)
 */
const deleteReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        const medicalRecord = await MedicalRecord.findOne({ user: req.user._id });

        if (!medicalRecord) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found'
            });
        }

        const report = medicalRecord.uploadedReports.id(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Delete from Cloudinary
        if (report.cloudinaryPublicId) {
            await deleteFromCloudinary(report.cloudinaryPublicId, 'raw');
        }

        // Remove from medical record
        medicalRecord.uploadedReports.pull(reportId);
        await medicalRecord.save();

        res.status(200).json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        console.error('Delete Report Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report'
        });
    }
};

/**
 * @desc    Get medical record timeline
 * @route   GET /api/user/medical-record/timeline
 * @access  Private (User)
 */
const getTimeline = async (req, res) => {
    try {
        const medicalRecord = await MedicalRecord.findOne({ user: req.user._id })
            .populate('versionHistory.performedBy.id', 'name email');

        if (!medicalRecord) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found'
            });
        }

        // Get timeline sorted by date
        const timeline = medicalRecord.versionHistory.sort((a, b) =>
            b.performedAt - a.performedAt
        );

        res.status(200).json({
            success: true,
            count: timeline.length,
            timeline
        });
    } catch (error) {
        console.error('Get Timeline Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch timeline'
        });
    }
};

module.exports = {
    getMedicalRecord,
    addDisease,
    addAllergy,
    uploadReport,
    deleteReport,
    getTimeline
};
