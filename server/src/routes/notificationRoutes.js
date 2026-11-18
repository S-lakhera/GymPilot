import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// All notification routes require authenticated session
router.use(verifyToken);

// 1. User notifications center endpoints
router.get('/', notificationController.getUserNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

// 2. Admin-only membership expirations desk & reminder triggers
router.post(
  '/sync-expirations',
  requireRoles(['admin']),
  notificationController.syncExpirations
);
router.get(
  '/admin/expirations-queue',
  requireRoles(['admin']),
  notificationController.getAdminExpirationsQueue
);
router.post(
  '/admin/remind/:subscriptionId',
  requireRoles(['admin']),
  notificationController.sendManualReminder
);

export default router;
