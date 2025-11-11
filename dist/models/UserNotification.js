"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userNotificationSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.userNotificationSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // title
    title: {
        type: String,
        required: true,
    },
    // content
    content: {
        type: String,
        required: true,
    },
    // isRead
    isRead: {
        type: Boolean,
        default: false,
    },
    // createdAt
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // updatedAt
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
const UserNotificationModel = mongoose_1.default.model("UserNotification", exports.userNotificationSchema);
exports.default = UserNotificationModel;
