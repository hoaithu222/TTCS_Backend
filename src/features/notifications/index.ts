import { Router } from "express";
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
  getUnreadCountController,
} from "./notification.controller";
import { authenticateToken } from "../../shared/middlewares/auth.middleware";

const notificationRouter = Router();

// Get notifications list
notificationRouter.get("/", authenticateToken, getNotificationsController);

// Get unread count
notificationRouter.get("/unread-count", authenticateToken, getUnreadCountController);

// Mark notification as read
notificationRouter.patch("/:id/read", authenticateToken, markAsReadController);

// Mark all notifications as read
notificationRouter.patch("/read-all", authenticateToken, markAllAsReadController);

// Delete notification
notificationRouter.delete("/:id", authenticateToken, deleteNotificationController);

export default notificationRouter;

