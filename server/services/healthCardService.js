const HealthCard = require('../models/HealthCard');
const User = require('../models/User');
const { generateCompleteQR } = require('./qrService');
const { createAuditLog } = require('../middleware/auditLogger');

/**
 * Check if user is eligible for health card generation
 * @param {Object} user - User object
 * @returns {Object} Eligibility status
 */
const checkEligibility = (user) => {
    const required = [
        user.name,
        user.email,
        user.mobile,
        user.dateOfBirth,
        user.gender,
        user.bloodGroup,
        user.emergencyContact?.name,
        user.emergencyContact?.mobile
    ];

    const isComplete = required.every(field => field !== undefined && field !== null && field !== '');

    if (!isComplete) {
        return {
            eligible: false,
            message: 'Please complete your profile: name, DOB, gender, blood group, and emergency contact are required',
            missing: {
                hasBasicInfo: !!(user.name && user.email && user.mobile),
                hasDOB: !!user.dateOfBirth,
                hasGender: !!user.gender,
                hasBloodGroup: !!user.bloodGroup,
                hasEmergencyContact: !!(user.emergencyContact?.name && user.emergencyContact?.mobile)
            }
        };
    }

    return {
        eligible: true,
        message: 'Profile is complete and eligible for health card generation'
    };
};

/**
 * Generate digital health card for user
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Generated health card
 */
const generateHealthCard = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Check eligibility
        const eligibility = checkEligibility(user);
        if (!eligibility.eligible) {
            throw new Error(eligibility.message);
        }

        // Check if health card already exists
        let healthCard = await HealthCard.findOne({ user: userId });

        if (healthCard && healthCard.isActive) {
            return {
                isNew: false,
                message: 'Health card already exists',
                healthCard
            };
        }

        // Generate unique health ID if not exists
        if (!user.uniqueHealthId) {
            user.generateHealthId();
            await user.save();
        }

        // Generate QR code
        const qrData = await generateCompleteQR({
            userId: user._id.toString(),
            healthId: user.uniqueHealthId,
            name: user.name
        });

        // Create card data snapshot
        const cardData = {
            name: user.name,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            bloodGroup: user.bloodGroup,
            emergencyContact: {
                name: user.emergencyContact.name,
                mobile: user.emergencyContact.mobile
            },
            address: {
                city: user.address?.city,
                state: user.address?.state
            }
        };

        if (healthCard) {
            // Regenerate existing card
            healthCard.qrToken = qrData.token;
            healthCard.qrCodeImageUrl = qrData.qrCodeImage;
            healthCard.qrGeneratedAt = new Date();
            healthCard.cardData = cardData;
            healthCard.isActive = true;
            healthCard.isRevoked = false;
            healthCard.lastRegeneratedAt = new Date();
            healthCard.regenerationCount += 1;
            await healthCard.save();
        } else {
            // Create new health card
            healthCard = await HealthCard.create({
                user: userId,
                uniqueHealthId: user.uniqueHealthId,
                qrToken: qrData.token,
                qrCodeImageUrl: qrData.qrCodeImage,
                cardData
            });
        }

        // Update user model
        user.healthCardGenerated = true;
        user.healthCardId = healthCard._id;
        await user.save();

        // Audit log
        await createAuditLog({
            actorModel: 'User',
            actorId: userId,
            actorName: user.name,
            actorEmail: user.email,
            action: 'health_card_generated',
            targetModel: 'HealthCard',
            targetId: healthCard._id,
            metadata: {
                healthId: user.uniqueHealthId,
                isRegeneration: healthCard.regenerationCount > 0
            }
        });

        console.log(`✅ Health card generated for ${user.name} (${user.uniqueHealthId})`);

        return {
            isNew: healthCard.regenerationCount === 0,
            message: 'Health card generated successfully',
            healthCard
        };
    } catch (error) {
        console.error('Generate Health Card Error:', error);
        throw error;
    }
};

/**
 * Get health card data for display
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Health card display data
 */
const getHealthCardData = async (userId) => {
    const healthCard = await HealthCard.findOne({ user: userId, isActive: true })
        .populate('user', 'name email mobile dateOfBirth gender bloodGroup emergencyContact address');

    if (!healthCard) {
        return null;
    }

    return {
        healthId: healthCard.uniqueHealthId,
        cardData: healthCard.cardData,
        qrCodeImage: healthCard.qrCodeImageUrl,
        generatedAt: healthCard.generatedAt,
        isActive: healthCard.isActive
    };
};

/**
 * Regenerate QR code for existing health card
 * @param {String} userId - User ID
 * @returns {Promise<Object>} Updated health card
 */
const regenerateQR = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const healthCard = await HealthCard.findOne({ user: userId });

    if (!healthCard) {
        throw new Error('Health card not found. Please generate a health card first.');
    }

    // Generate new QR code
    const qrData = await generateCompleteQR({
        userId: user._id.toString(),
        healthId: user.uniqueHealthId,
        name: user.name
    });

    // Update health card
    healthCard.qrToken = qrData.token;
    healthCard.qrCodeImageUrl = qrData.qrCodeImage;
    healthCard.qrGeneratedAt = new Date();
    healthCard.lastRegeneratedAt = new Date();
    healthCard.regenerationCount += 1;
    await healthCard.save();

    // Audit log
    await createAuditLog({
        actorModel: 'User',
        actorId: userId,
        actorName: user.name,
        actorEmail: user.email,
        action: 'qr_regenerated',
        targetModel: 'HealthCard',
        targetId: healthCard._id
    });

    console.log(`✅ QR regenerated for ${user.name}`);

    return healthCard;
};

/**
 * Disable/revoke health card
 * @param {String} userId - User ID
 * @param {String} reason - Reason for revocation
 * @returns {Promise<Object>} Updated health card
 */
const disableHealthCard = async (userId, reason = 'User requested') => {
    const healthCard = await HealthCard.findOne({ user: userId });

    if (!healthCard) {
        throw new Error('Health card not found');
    }

    healthCard.isActive = false;
    healthCard.isRevoked = true;
    healthCard.revokedAt = new Date();
    healthCard.revokedReason = reason;
    await healthCard.save();

    // Update user model
    await User.findByIdAndUpdate(userId, { healthCardGenerated: false });

    // Audit log
    await createAuditLog({
        actorModel: 'User',
        actorId: userId,
        action: 'qr_disabled',
        targetModel: 'HealthCard',
        targetId: healthCard._id,
        metadata: { reason }
    });

    console.log(`🚫 Health card disabled for user ${userId}`);

    return healthCard;
};

module.exports = {
    checkEligibility,
    generateHealthCard,
    getHealthCardData,
    regenerateQR,
    disableHealthCard
};
