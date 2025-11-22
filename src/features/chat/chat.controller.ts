import { Request, Response } from "express";
import ChatService from "./chat.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import type {
  ConversationListQuery,
  MessageListQuery,
  SendMessageRequest,
} from "./types";

export const getConversationsController = async (req: Request, res: Response) => {
  const query = req.query as unknown as ConversationListQuery;
  const result = await ChatService.getConversations(req as AuthenticatedRequest, query);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.data);
};

export const getConversationController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ChatService.getConversation(req as AuthenticatedRequest, id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.data);
};

export const getMessagesController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const query = req.query as unknown as MessageListQuery;
  const result = await ChatService.getMessages(
    req as AuthenticatedRequest,
    id,
    query
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.data);
};

export const sendMessageController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as SendMessageRequest;
  const result = await ChatService.sendMessage(req as AuthenticatedRequest, id, data);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.data, "Gửi tin nhắn thành công");
};

export const markAsReadController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ChatService.markAsRead(req as AuthenticatedRequest, id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, undefined, "Đã đánh dấu đã đọc");
};

export const markAsDeliveredController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ChatService.markAsDelivered(req as AuthenticatedRequest, id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, undefined, "Đã đánh dấu đã gửi");
};

