"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("./chat.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const chatRouter = (0, express_1.Router)();
// Create a new conversation (POST must be before GET with :id parameter)
chatRouter.post("/conversations", auth_middleware_1.authenticateToken, chat_controller_1.createConversationController);
// Get conversations list
chatRouter.get("/conversations", auth_middleware_1.authenticateToken, chat_controller_1.getConversationsController);
// Get conversation detail
chatRouter.get("/conversations/:id", auth_middleware_1.authenticateToken, chat_controller_1.getConversationController);
// Get messages in a conversation
chatRouter.get("/conversations/:id/messages", auth_middleware_1.authenticateToken, chat_controller_1.getMessagesController);
// Send a message
chatRouter.post("/conversations/:id/messages", auth_middleware_1.authenticateToken, chat_controller_1.sendMessageController);
// Get or create shop-customer conversation
chatRouter.post("/conversations/shop", auth_middleware_1.authenticateToken, chat_controller_1.getOrCreateConversationForShopController);
// Mark conversation as read
chatRouter.patch("/conversations/:id/read", auth_middleware_1.authenticateToken, chat_controller_1.markAsReadController);
// Mark conversation as delivered
chatRouter.patch("/conversations/:id/delivered", auth_middleware_1.authenticateToken, chat_controller_1.markAsDeliveredController);
exports.default = chatRouter;
