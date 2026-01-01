const AuditLog = require('../models/AuditLog');

/**
 * Audit logging middleware
 * Automatically logs certain actions
 */
const auditLogger = (action) => {
    return async (req, res, next) => {
        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json
        res.json = function (data) {
            // Only log if request was successful
            if (data.success) {
                // Create audit log asynchronously (don't wait for it)
                AuditLog.create({
                    actor: {
                        model: req.userRole === 'user' ? 'User' : req.userRole === 'doctor' ? 'Doctor' : 'Admin',
                        id: req.user?._id,
                        name: req.user?.name,
                        email: req.user?.email
                    },
                    action,
                    target: data.targetId ? {
                        model: data.targetModel,
                        id: data.targetId
                    } : undefined,
                    metadata: data.metadata || {},
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent'),
                    status: 'success'
                }).catch(err => console.error('Audit Log Error:', err));
            }

            // Call original res.json
            return originalJson(data);
        };

        next();
    };
};

/**
 * Manual audit log creation
 */
const createAuditLog = async ({
    actorModel,
    actorId,
    actorName,
    actorEmail,
    action,
    targetModel,
    targetId,
    metadata,
    ipAddress,
    userAgent,
    status = 'success',
    errorMessage
}) => {
    try {
        await AuditLog.create({
            actor: {
                model: actorModel,
                id: actorId,
                name: actorName,
                email: actorEmail
            },
            action,
            target: targetId ? {
                model: targetModel,
                id: targetId
            } : undefined,
            metadata: metadata || {},
            ipAddress,
            userAgent,
            status,
            errorMessage
        });
    } catch (error) {
        console.error('Audit Log Creation Error:', error);
    }
};

module.exports = {
    auditLogger,
    createAuditLog
};
