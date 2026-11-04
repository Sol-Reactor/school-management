import express from 'express';
import {
  deleteNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listNotificationsQuery } from '../validation/schemas.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validate({ query: listNotificationsQuery }), getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
