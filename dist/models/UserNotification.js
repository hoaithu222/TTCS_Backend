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
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        default: "system",
    },
    icon: {
        type: String,
    },
    actionUrl: {
        type: String,
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: {},
    },
    priority: {
        type: String,
        enum: ["low", "normal", "high"],
        default: "normal",
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
    },
}, { timestamps: true });
exports.userNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
const UserNotificationModel = mongoose_1.default.model("UserNotification", exports.userNotificationSchema);
exports.default = UserNotificationModel;
