const User = require('../models/User');
const HealthCard = require('../models/HealthCard');
const {
    checkEligibility,
    generateHealthCard,
    getHealthCardData,
    regenerateQR,
    disableHealthCard
} = require('../services/healthCardService');

/**
 * @desc    Check eligibility for health card
 * @route   GET /api/user/health-card/eligibility
 * @access  Private (User)
 */
const getEligibility = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const eligibility = checkEligibility(user);

        res.status(200).json({
            success: true,
            ...eligibility
        });
    } catch (error) {
        console.error('Check Eligibility Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check eligibility'
        });
    }
};

/**
 * @desc    Generate health card
 * @route   POST /api/user/health-card/generate
 * @access  Private (User)
 */
const generateCard = async (req, res) => {
    try {
        const result = await generateHealthCard(req.user._id);

        res.status(result.isNew ? 201 : 200).json({
            success: true,
            message: result.message,
            isNew: result.isNew,
            healthCard: {
                id: result.healthCard._id,
                uniqueHealthId: result.healthCard.uniqueHealthId,
                qrCodeImage: result.healthCard.qrCodeImageUrl,
                generatedAt: result.healthCard.generatedAt,
                cardData: result.healthCard.cardData
            }
        });
    } catch (error) {
        console.error('Generate Health Card Error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to generate health card'
        });
    }
};

/**
 * @desc    Get health card
 * @route   GET /api/user/health-card
 * @access  Private (User)
 */
const getCard = async (req, res) => {
    try {
        const healthCardData = await getHealthCardData(req.user._id);

        if (!healthCardData) {
            return res.status(404).json({
                success: false,
                message: 'Health card not found. Please generate a health card first.'
            });
        }

        res.status(200).json({
            success: true,
            healthCard: healthCardData
        });
    } catch (error) {
        console.error('Get Health Card Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch health card'
        });
    }
};

/**
 * @desc    Regenerate QR code
 * @route   POST /api/user/health-card/regenerate-qr
 * @access  Private (User)
 */
const regenerateQRCode = async (req, res) => {
    try {
        const healthCard = await regenerateQR(req.user._id);

        res.status(200).json({
            success: true,
            message: 'QR code regenerated successfully',
            qrCodeImage: healthCard.qrCodeImageUrl,
            regeneratedAt: healthCard.lastRegeneratedAt,
            regenerationCount: healthCard.regenerationCount
        });
    } catch (error) {
        console.error('Regenerate QR Error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to regenerate QR code'
        });
    }
};

/**
 * @desc    Disable health card
 * @route   POST /api/user/health-card/disable
 * @access  Private (User)
 */
const disableCard = async (req, res) => {
    try {
        const { reason } = req.body;

        const healthCard = await disableHealthCard(req.user._id, reason);

        res.status(200).json({
            success: true,
            message: 'Health card disabled successfully',
            disabledAt: healthCard.revokedAt
        });
    } catch (error) {
        console.error('Disable Health Card Error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to disable health card'
        });
    }
};

/**
 * @desc    Download health card data (for PDF generation on frontend)
 * @route   GET /api/user/health-card/download-data
 * @access  Private (User)
 */
const getDownloadData = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const healthCard = await HealthCard.findOne({ user: req.user._id, isActive: true });

        if (!healthCard) {
            return res.status(404).json({
                success: false,
                message: 'Health card not found'
            });
        }

        // Complete data for PDF generation
        const downloadData = {
            // Header
            title: 'Digital Health Card',
            subtitle: 'Government of India | Ministry of Health',

            // Personal Info
            uniqueHealthId: healthCard.uniqueHealthId,
            name: user.name,
            dateOfBirth: user.dateOfBirth,
            age: user.dateOfBirth ? Math.floor((new Date() - new Date(user.dateOfBirth)) / 31557600000) : null,
            gender: user.gender,
            bloodGroup: user.bloodGroup,

            // Contact
            mobile: user.mobile,
            email: user.email,

            // Address
            address: user.address,

            // Emergency Contact
            emergencyContact: user.emergencyContact,

            // QR Code
            qrCodeImage: healthCard.qrCodeImageUrl,

            // Issue Date
            issuedDate: healthCard.generatedAt,

            // Footer
            disclaimer: 'This is a digitally generated health card. Scan QR code for emergency medical information.'
        };

        res.status(200).json({
            success: true,
            data: downloadData
        });
    } catch (error) {
        console.error('Get Download Data Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch download data'
        });
    }
};

module.exports = {
    getEligibility,
    generateCard,
    getCard,
    regenerateQRCode,
    disableCard,
    getDownloadData
};
