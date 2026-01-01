const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');

/**
 * @desc    Get doctor profile
 * @route   GET /api/doctor/profile
 * @access  Private (Doctor)
 */
const getProfile = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user._id)
            .select('-password')
            .populate('approvedBy', 'name email')
            .populate('rejectedBy', 'name email');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            doctor
        });
    } catch (error) {
        console.error('Get Doctor Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};

/**
 * @desc    Search patients by name, email, or mobile
 * @route   GET /api/doctor/patients?search=query
 * @access  Private (Approved Doctor)
 */
const searchPatients = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search) {
            return res.status(400).json({
                success: false,
                message: 'Please provide search query'
            });
        }

        // Search by name, email, or mobile
        const patients = await User.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ],
            isActive: true
        })
            .select('name email mobile bloodGroup uniqueHealthId')
            .limit(20);

        res.status(200).json({
            success: true,
            count: patients.length,
            patients
        });
    } catch (error) {
        console.error('Search Patients Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search patients'
        });
    }
};

/**
 * @desc    Get patient details
 * @route   GET /api/doctor/patient/:userId
 * @access  Private (Approved Doctor)
 */
const getPatientDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        const patient = await User.findById(userId).select('-password');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Create audit log for viewing patient record
        await createAuditLog({
            actorModel: 'Doctor',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'patient_record_viewed',
            targetModel: 'User',
            targetId: patient._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                patientName: patient.name
            }
        });

        res.status(200).json({
            success: true,
            patient
        });
    } catch (error) {
        console.error('Get Patient Details Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient details'
        });
    }
};

/**
 * @desc    Get doctor dashboard stats
 * @route   GET /api/doctor/dashboard
 * @access  Private (Doctor)
 */
const getDashboard = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user._id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // TODO: Get patient interaction stats when medical records are implemented
        const stats = {
            approvalStatus: doctor.approvalStatus,
            canAccessSystem: doctor.canAccessSystem(),
            patientsVerified: 0, // Will be updated when medical records are implemented
            actionsPerformed: 0  // Will be updated when medical records are implemented
        };

        res.status(200).json({
            success: true,
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                specialization: doctor.specialization,
                hospitalName: doctor.hospitalName,
                approvalStatus: doctor.approvalStatus,
                canAccessSystem: doctor.canAccessSystem()
            },
            stats
        });
    } catch (error) {
        console.error('Get Doctor Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard'
        });
    }
};

module.exports = {
    getProfile,
    searchPatients,
    getPatientDetails,
    getDashboard
};
