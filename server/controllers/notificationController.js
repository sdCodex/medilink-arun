const Notification = require('../models/Notification');

/**
 * @desc    Get all notifications for logged in user
 * @route   GET /api/user/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            'recipient.id': req.user._id
        }).sort({ createdAt: -1 }).limit(50);

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/user/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                'recipient.id': req.user._id
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/user/notifications/read-all
 * @access  Private
 */
const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                'recipient.id': req.user._id,
                isRead: false
            },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark All Read Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/user/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            'recipient.id': req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete Notification Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllRead,
    deleteNotification
};
