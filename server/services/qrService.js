const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate secure QR token (JWT)
 * @param {Object} data - Data to encode in token
 * @returns {String} JWT token
 */
const generateQRToken = (data) => {
    const token = jwt.sign(
        {
            type: 'emergency_access',
            userId: data.userId,
            healthId: data.healthId,
            timestamp: Date.now(),
            // Add hash of critical data for integrity verification
            dataHash: crypto
                .createHash('sha256')
                .update(JSON.stringify(data))
                .digest('hex')
        },
        process.env.QR_ENCRYPTION_KEY || process.env.JWT_SECRET,
        {
            expiresIn: '10y' // Long expiry for health cards
        }
    );

    return token;
};

/**
 * Verify QR token
 * @param {String} token - JWT token from QR code
 * @returns {Object} Decoded token data
 */
const verifyQRToken = (token) => {
    try {
        const decoded = jwt.verify(
            token,
            process.env.QR_ENCRYPTION_KEY || process.env.JWT_SECRET
        );

        return {
            success: true,
            data: decoded
        };
    } catch (error) {
        return {
            success: false,
            message: error.message === 'jwt expired'
                ? 'QR code has expired'
                : 'Invalid QR code'
        };
    }
};

/**
 * Generate QR code image (base64)
 * @param {String} data - Data to encode (usually the QR token)
 * @returns {Promise<String>} Base64 QR code image
 */
const generateQRCodeImage = async (data) => {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return qrCodeDataUrl; // Returns data:image/png;base64,...
    } catch (error) {
        console.error('QR Code Generation Error:', error);
        throw new Error('Failed to generate QR code image');
    }
};

/**
 * Generate emergency access URL with QR token
 * @param {String} token - QR token
 * @returns {String} Full emergency access URL
 */
const generateEmergencyAccessUrl = (token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl}/emergency?token=${encodeURIComponent(token)}`;
};

/**
 * Complete QR generation workflow
 * @param {Object} userData - User data for QR
 * @returns {Promise<Object>} QR token and image
 */
const generateCompleteQR = async (userData) => {
    // Generate token
    const token = generateQRToken({
        userId: userData.userId,
        healthId: userData.healthId,
        name: userData.name
    });

    // Create emergency URL
    const emergencyUrl = generateEmergencyAccessUrl(token);

    // Generate QR code image from URL
    const qrCodeImage = await generateQRCodeImage(emergencyUrl);

    return {
        token,
        emergencyUrl,
        qrCodeImage // Base64 data URL
    };
};

module.exports = {
    generateQRToken,
    verifyQRToken,
    generateQRCodeImage,
    generateEmergencyAccessUrl,
    generateCompleteQR
};
