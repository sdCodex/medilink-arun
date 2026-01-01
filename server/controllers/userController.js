const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private (User)
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/user/profile
 * @access  Private (User)
 */
const updateProfile = async (req, res) => {
    try {
        const {
            name,
            dateOfBirth,
            gender,
            bloodGroup,
            address
        } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (gender) user.gender = gender;
        if (bloodGroup) user.bloodGroup = bloodGroup;
        if (address) user.address = address;

        // Check if profile is complete
        user.checkProfileComplete();

        // Generate unique health ID if not exists and profile is complete
        if (user.isProfileComplete && !user.uniqueHealthId) {
            user.generateHealthId();
        }

        await user.save();

        // Create audit log
        await createAuditLog({
            actorModel: 'User',
            actorId: user._id,
            actorName: user.name,
            actorEmail: user.email,
            action: 'user_profile_updated',
            targetModel: 'User',
            targetId: user._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                isProfileComplete: user.isProfileComplete,
                hasHealthId: !!user.uniqueHealthId
            }
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                bloodGroup: user.bloodGroup,
                address: user.address,
                isProfileComplete: user.isProfileComplete,
                uniqueHealthId: user.uniqueHealthId
            }
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile'
        });
    }
};

/**
 * @desc    Add or update emergency contact
 * @route   POST /api/user/emergency-contact
 * @access  Private (User)
 */
const updateEmergencyContact = async (req, res) => {
    try {
        const { name, relationship, mobile, email } = req.body;

        if (!name || !mobile) {
            return res.status(400).json({
                success: false,
                message: 'Please provide emergency contact name and mobile'
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.emergencyContact = {
            name,
            relationship,
            mobile,
            email
        };

        // Check if profile is complete
        user.checkProfileComplete();

        await user.save();

        // Create audit log
        await createAuditLog({
            actorModel: 'User',
            actorId: user._id,
            actorName: user.name,
            actorEmail: user.email,
            action: 'emergency_contact_updated',
            targetModel: 'User',
            targetId: user._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(200).json({
            success: true,
            message: 'Emergency contact updated successfully',
            emergencyContact: user.emergencyContact,
            isProfileComplete: user.isProfileComplete
        });
    } catch (error) {
        console.error('Update Emergency Contact Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update emergency contact'
        });
    }
};

/**
 * @desc    Add self-reported medical history
 * @route   POST /api/user/medical-history
 * @access  Private (User)
 */
const addMedicalHistory = async (req, res) => {
    try {
        const { diseases, allergies } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add self-reported diseases
        if (diseases && Array.isArray(diseases)) {
            user.selfReportedDiseases = [...new Set([...user.selfReportedDiseases, ...diseases])];
        }

        // Add self-reported allergies
        if (allergies && Array.isArray(allergies)) {
            user.selfReportedAllergies = [...new Set([...user.selfReportedAllergies, ...allergies])];
        }

        await user.save();

        // Create audit log
        await createAuditLog({
            actorModel: 'User',
            actorId: user._id,
            actorName: user.name,
            actorEmail: user.email,
            action: 'medical_history_added',
            targetModel: 'User',
            targetId: user._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                diseasesCount: user.selfReportedDiseases.length,
                allergiesCount: user.selfReportedAllergies.length
            }
        });

        res.status(200).json({
            success: true,
            message: 'Medical history updated successfully',
            selfReportedDiseases: user.selfReportedDiseases,
            selfReportedAllergies: user.selfReportedAllergies
        });
    } catch (error) {
        console.error('Add Medical History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add medical history'
        });
    }
};

/**
 * @desc    Get user dashboard stats
 * @route   GET /api/user/dashboard
 * @access  Private (User)
 */
const getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('healthCardId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // TODO: Fetch medical records count when medical record model is implemented
        const stats = {
            profileCompleteness: user.isProfileComplete ? 100 : 50,
            hasHealthCard: user.healthCardGenerated,
            hasEmergencyContact: !!user.emergencyContact?.name,
            selfReportedDiseasesCount: user.selfReportedDiseases.length,
            selfReportedAllergiesCount: user.selfReportedAllergies.length
        };

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                uniqueHealthId: user.uniqueHealthId,
                bloodGroup: user.bloodGroup,
                isProfileComplete: user.isProfileComplete,
                healthCardGenerated: user.healthCardGenerated
            },
            stats
        });
    } catch (error) {
        console.error('Get Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    updateEmergencyContact,
    addMedicalHistory,
    getDashboard
};
