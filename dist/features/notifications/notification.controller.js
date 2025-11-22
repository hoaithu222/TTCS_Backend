"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCountController = exports.deleteNotificationController = exports.markAllAsReadController = exports.markAsReadController = exports.getNotificationsController = void 0;
const notification_service_1 = __importDefault(require("./notification.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getNotificationsController = async (req, res) => {
    const query = req.query;
    const result = await notification_service_1.default.getNotifications(req, query);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.data);
};
exports.getNotificationsController = getNotificationsController;
const markAsReadController = async (req, res) => {
    const { id } = req.params;
    const result = await notification_service_1.default.markAsRead(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.data);
};
exports.markAsReadController = markAsReadController;
const markAllAsReadController = async (req, res) => {
    const result = await notification_service_1.default.markAllAsRead(req);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, undefined, "Đã đánh dấu tất cả thông báo là đã đọc");
};
exports.markAllAsReadController = markAllAsReadController;
const deleteNotificationController = async (req, res) => {
    const { id } = req.params;
    const result = await notification_service_1.default.deleteNotification(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, undefined, "Đã xóa thông báo");
};
exports.deleteNotificationController = deleteNotificationController;
const getUnreadCountController = async (req, res) => {
    const result = await notification_service_1.default.getUnreadCount(req);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.data);
};
exports.getUnreadCountController = getUnreadCountController;
