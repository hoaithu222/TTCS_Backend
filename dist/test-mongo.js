"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const testMongoConnection = async () => {
    console.log("🔍 Testing MongoDB connection...");
    try {
        await mongoose_1.default.connect("mongodb://localhost:27017/mylove");
        console.log("✅ MongoDB connected successfully!");
        console.log("📊 Ready to use MongoDB");
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1);
    }
};
testMongoConnection();
