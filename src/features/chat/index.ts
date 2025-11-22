import { Router } from "express";
import {
  getConversationsController,
  getConversationController,
  getMessagesController,
  sendMessageController,
  markAsReadController,
  markAsDeliveredController,
} from "./chat.controller";
import { authenticateToken } from "../../shared/middlewares/auth.middleware";

const chatRouter = Router();

// Get conversations list
chatRouter.get("/conversations", authenticateToken, getConversationsController);

// Get conversation detail
chatRouter.get("/conversations/:id", authenticateToken, getConversationController);

// Get messages in a conversation
chatRouter.get("/conversations/:id/messages", authenticateToken, getMessagesController);

// Send a message
chatRouter.post("/conversations/:id/messages", authenticateToken, sendMessageController);

// Mark conversation as read
chatRouter.patch("/conversations/:id/read", authenticateToken, markAsReadController);

// Mark conversation as delivered
chatRouter.patch(
  "/conversations/:id/delivered",
  authenticateToken,
  markAsDeliveredController
);

export default chatRouter;

