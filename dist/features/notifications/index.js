"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const notificationRouter = (0, express_1.Router)();
// Get notifications list
notificationRouter.get("/", auth_middleware_1.authenticateToken, notification_controller_1.getNotificationsController);
// Get unread count
notificationRouter.get("/unread-count", auth_middleware_1.authenticateToken, notification_controller_1.getUnreadCountController);
// Mark notification as read
notificationRouter.patch("/:id/read", auth_middleware_1.authenticateToken, notification_controller_1.markAsReadController);
// Mark all notifications as read
notificationRouter.patch("/read-all", auth_middleware_1.authenticateToken, notification_controller_1.markAllAsReadController);
// Delete notification
notificationRouter.delete("/:id", auth_middleware_1.authenticateToken, notification_controller_1.deleteNotificationController);
exports.default = notificationRouter;
