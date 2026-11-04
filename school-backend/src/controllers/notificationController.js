import prisma from '../lib/prisma.js';
import { notFound } from '../lib/errors.js';

// GET /api/notifications
export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const where = { userId, ...(req.query.unreadOnly && { read: false }) };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  res.json({ notifications, unreadCount });
};

const findOwn = async (id, userId) => {
  const notification = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notification) throw notFound('Notification not found');
  return notification;
};

// PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  await findOwn(req.params.id, req.user.id);
  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  res.json(updated);
};

// PUT /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });
  res.json({ message: 'All notifications marked as read' });
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  await findOwn(req.params.id, req.user.id);
  await prisma.notification.delete({ where: { id: req.params.id } });
  res.json({ message: 'Notification deleted' });
};

// ---------- helpers used by other controllers ----------

export const createNotification = (userId, title, message, type = 'GENERAL') =>
  prisma.notification.create({ data: { userId, title, message, type } });

export const notifyAdmins = async (title, message, type = 'GENERAL') => {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isDemo: false },
    select: { id: true },
  });
  if (admins.length === 0) return { count: 0 };
  return prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, title, message, type })),
  });
};

/** Fire-and-forget wrapper: logs instead of failing the request. */
export const notifySafely = (...promises) =>
  Promise.allSettled(promises.filter(Boolean)).then((results) => {
    for (const r of results) {
      if (r.status === 'rejected') console.error('Notification failed:', r.reason?.message);
    }
  });
