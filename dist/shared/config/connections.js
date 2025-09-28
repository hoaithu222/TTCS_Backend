"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeConnections = exports.checkConnections = exports.mongoConnection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("./database");
// MongoDB Connection
exports.mongoConnection = mongoose_1.default.connect(database_1.mongoConfig.uri, database_1.mongoConfig.options);
// Connection status check
const checkConnections = async () => {
    try {
        // Test MongoDB only
        await exports.mongoConnection;
        console.log("✅ MongoDB connected successfully");
        return true;
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        return false;
    }
};
exports.checkConnections = checkConnections;
// Graceful shutdown
const closeConnections = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log("✅ All database connections closed");
    }
    catch (error) {
        console.error("❌ Error closing connections:", error);
    }
};
exports.closeConnections = closeConnections;
