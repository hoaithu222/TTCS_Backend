import { Request, Response } from "express";
import NotificationService from "./notification.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import type { NotificationListQuery } from "./types";

export const getNotificationsController = async (req: Request, res: Response) => {
  const query = req.query as unknown as NotificationListQuery;
  const result = await NotificationService.getNotifications(
    req as AuthenticatedRequest,
    query
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.data);
};

export const markAsReadController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotificationService.markAsRead(req as AuthenticatedRequest, id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.data);
};

export const markAllAsReadController = async (req: Request, res: Response) => {
  const result = await NotificationService.markAllAsRead(req as AuthenticatedRequest);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, undefined, "Đã đánh dấu tất cả thông báo là đã đọc");
};

export const deleteNotificationController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotificationService.deleteNotification(
    req as AuthenticatedRequest,
    id
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, undefined, "Đã xóa thông báo");
};

export const getUnreadCountController = async (req: Request, res: Response) => {
  const result = await NotificationService.getUnreadCount(req as AuthenticatedRequest);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.data);
};

