"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsDeliveredController = exports.markAsReadController = exports.sendMessageController = exports.getMessagesController = exports.getConversationController = exports.createConversationController = exports.getConversationsController = void 0;
const chat_service_1 = __importDefault(require("./chat.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getConversationsController = async (req, res) => {
    const query = req.query;
    const result = await chat_service_1.default.getConversations(req, query);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.data);
};
exports.getConversationsController = getConversationsController;
const createConversationController = async (req, res) => {
    const data = req.body;
    const result = await chat_service_1.default.createConversation(req, data);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.data, "Tạo cuộc trò chuyện thành công");
};
exports.createConversationController = createConversationController;
const getConversationController = async (req, res) => {
    const { id } = req.params;
    const result = await chat_service_1.default.getConversation(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.data);
};
exports.getConversationController = getConversationController;
const getMessagesController = async (req, res) => {
    const { id } = req.params;
    const query = req.query;
    const result = await chat_service_1.default.getMessages(req, id, query);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.data);
};
exports.getMessagesController = getMessagesController;
const sendMessageController = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const result = await chat_service_1.default.sendMessage(req, id, data);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.data, "Gửi tin nhắn thành công");
};
exports.sendMessageController = sendMessageController;
const markAsReadController = async (req, res) => {
    const { id } = req.params;
    const result = await chat_service_1.default.markAsRead(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, undefined, "Đã đánh dấu đã đọc");
};
exports.markAsReadController = markAsReadController;
const markAsDeliveredController = async (req, res) => {
    const { id } = req.params;
    const result = await chat_service_1.default.markAsDelivered(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, undefined, "Đã đánh dấu đã gửi");
};
exports.markAsDeliveredController = markAsDeliveredController;
