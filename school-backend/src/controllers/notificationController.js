import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get user notifications
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { unreadOnly } = req.query;

        const where = { userId };
        if (unreadOnly === 'true') {
            where.read = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to last 50 notifications
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, read: false },
        });

        res.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { read: true },
        });

        res.json(updated);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create notification (helper function)
export const createNotification = async (userId, title, message, type) => {
    try {
        return await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
            },
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await prisma.notification.delete({
            where: { id },
        });

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Notify all admins (helper function)
export const notifyAdmins = async (title, message, type = 'GENERAL') => {
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true },
        });

        const notifications = admins.map(admin =>
            prisma.notification.create({
                data: {
                    userId: admin.id,
                    title,
                    message,
                    type,
                },
            })
        );

        await Promise.all(notifications);
        return { success: true, count: admins.length };
    } catch (error) {
        console.error('Error notifying admins:', error);
        throw error;
    }
};
