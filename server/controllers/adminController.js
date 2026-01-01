const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { createAuditLog } = require('../middleware/auditLogger');
const { sendEmail } = require('../services/notificationService');

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin)
 */
const getDashboardStats = async (req, res) => {
    try {
        // Get counts
        const totalUsers = await User.countDocuments({ isActive: true });
        const totalDoctors = await Doctor.countDocuments({ isActive: true });
        const pendingDoctors = await Doctor.countDocuments({
            approvalStatus: 'pending',
            isActive: true
        });
        const approvedDoctors = await Doctor.countDocuments({
            approvalStatus: 'approved',
            isActive: true
        });
        const rejectedDoctors = await Doctor.countDocuments({
            approvalStatus: 'rejected'
        });

        // Get recent activity
        const recentActivity = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('actor action createdAt');

        const stats = {
            users: {
                total: totalUsers,
                verified: await User.countDocuments({
                    isEmailVerified: true,
                    isMobileVerified: true,
                    isActive: true
                })
            },
            doctors: {
                total: totalDoctors,
                pending: pendingDoctors,
                approved: approvedDoctors,
                rejected: rejectedDoctors
            },
            recentActivity
        };

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get Dashboard Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
};

/**
 * @desc    Get pending doctors for approval
 * @route   GET /api/admin/pending-doctors
 * @access  Private (Admin)
 */
const getPendingDoctors = async (req, res) => {
    try {
        const pendingDoctors = await Doctor.find({
            approvalStatus: 'pending',
            isActive: true
        })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pendingDoctors.length,
            doctors: pendingDoctors
        });
    } catch (error) {
        console.error('Get Pending Doctors Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending doctors'
        });
    }
};

/**
 * @desc    Approve doctor
 * @route   POST /api/admin/approve-doctor/:doctorId
 * @access  Private (Admin)
 */
const approveDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        if (doctor.approvalStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Doctor is already ${doctor.approvalStatus}`
            });
        }

        // Update approval status
        doctor.approvalStatus = 'approved';
        doctor.approvedBy = req.user._id;
        doctor.approvedAt = new Date();
        await doctor.save();

        // Send approval notification
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Account Approved!</h1>
          </div>
          <div class="content">
            <h2>Hello Dr. ${doctor.name},</h2>
            <div class="success-box">
              <p><strong>Congratulations!</strong> Your MedLink doctor account has been approved.</p>
            </div>
            <p>You can now access the full system and begin verifying patient medical records.</p>
            <p>Login to your account to get started: <a href="${process.env.FRONTEND_URL}/doctor/login">MedLink Doctor Portal</a></p>
            <p>Thank you for joining MedLink!</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await sendEmail({
            email: doctor.email,
            subject: 'MedLink Account Approved - Welcome!',
            htmlContent: emailHtml,
            recipientId: doctor._id,
            recipientModel: 'Doctor',
            purpose: 'doctor_approval'
        });

        // Create audit log
        await createAuditLog({
            actorModel: 'Admin',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'doctor_approved',
            targetModel: 'Doctor',
            targetId: doctor._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                doctorName: doctor.name,
                doctorEmail: doctor.email
            }
        });

        res.status(200).json({
            success: true,
            message: 'Doctor approved successfully',
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                approvalStatus: doctor.approvalStatus,
                approvedAt: doctor.approvedAt
            }
        });
    } catch (error) {
        console.error('Approve Doctor Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve doctor'
        });
    }
};

/**
 * @desc    Reject doctor
 * @route   POST /api/admin/reject-doctor/:doctorId
 * @access  Private (Admin)
 */
const rejectDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { reason } = req.body;

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        if (doctor.approvalStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Doctor is already ${doctor.approvalStatus}`
            });
        }

        // Update rejection status
        doctor.approvalStatus = 'rejected';
        doctor.rejectedBy = req.user._id;
        doctor.rejectedAt = new Date();
        doctor.rejectionReason = reason || 'No reason provided';
        await doctor.save();

        // Send rejection notification
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Application Update</h1>
          </div>
          <div class="content">
            <h2>Hello Dr. ${doctor.name},</h2>
            <div class="warning-box">
              <p>We regret to inform you that your MedLink doctor application has been rejected.</p>
              <p><strong>Reason:</strong> ${doctor.rejectionReason}</p>
            </div>
            <p>If you believe this was an error or would like to reapply with updated credentials, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        await sendEmail({
            email: doctor.email,
            subject: 'MedLink Application Update',
            htmlContent: emailHtml,
            recipientId: doctor._id,
            recipientModel: 'Doctor',
            purpose: 'doctor_rejection'
        });

        // Create audit log
        await createAuditLog({
            actorModel: 'Admin',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'doctor_rejected',
            targetModel: 'Doctor',
            targetId: doctor._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                doctorName: doctor.name,
                doctorEmail: doctor.email,
                reason: doctor.rejectionReason
            }
        });

        res.status(200).json({
            success: true,
            message: 'Doctor rejected',
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                approvalStatus: doctor.approvalStatus,
                rejectionReason: doctor.rejectionReason
            }
        });
    } catch (error) {
        console.error('Reject Doctor Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject doctor'
        });
    }
};

/**
 * @desc    Revoke doctor access
 * @route   POST /api/admin/revoke-doctor/:doctorId
 * @access  Private (Admin)
 */
const revokeDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { reason } = req.body;

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Deactivate account
        doctor.isActive = false;
        await doctor.save();

        // Send notification
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <h2>Account Access Revoked</h2>
        <p>Hello Dr. ${doctor.name},</p>
        <p>Your access to the MedLink system has been revoked.</p>
        <p><strong>Reason:</strong> ${reason || 'Administrative decision'}</p>
        <p>Please contact support for more information.</p>
      </body>
      </html>
    `;

        await sendEmail({
            email: doctor.email,
            subject: 'MedLink Account Access Revoked',
            htmlContent: emailHtml,
            recipientId: doctor._id,
            recipientModel: 'Doctor',
            purpose: 'doctor_revoked'
        });

        // Create audit log
        await createAuditLog({
            actorModel: 'Admin',
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            action: 'doctor_revoked',
            targetModel: 'Doctor',
            targetId: doctor._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                doctorName: doctor.name,
                reason: reason || 'No reason provided'
            }
        });

        res.status(200).json({
            success: true,
            message: 'Doctor access revoked successfully'
        });
    } catch (error) {
        console.error('Revoke Doctor Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke doctor access'
        });
    }
};

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            users
        });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

/**
 * @desc    Get all doctors
 * @route   GET /api/admin/doctors
 * @access  Private (Admin)
 */
const getAllDoctors = async (req, res) => {
    try {
        const { status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = status ? { approvalStatus: status } : {};

        const doctors = await Doctor.find(query)
            .select('-password')
            .populate('approvedBy', 'name email')
            .populate('rejectedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Doctor.countDocuments(query);

        res.status(200).json({
            success: true,
            count: doctors.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            doctors
        });
    } catch (error) {
        console.error('Get All Doctors Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch doctors'
        });
    }
};

/**
 * @desc    Get audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin)
 */
const getAuditLogs = async (req, res) => {
    try {
        const { action, actorId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const query = {};
        if (action) query.action = action;
        if (actorId) query['actor.id'] = actorId;

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AuditLog.countDocuments(query);

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            logs
        });
    } catch (error) {
        console.error('Get Audit Logs Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs'
        });
    }
};

module.exports = {
    getDashboardStats,
    getPendingDoctors,
    approveDoctor,
    rejectDoctor,
    revokeDoctor,
    getAllUsers,
    getAllDoctors,
    getAuditLogs
};
