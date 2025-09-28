"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// Environment configuration
exports.env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "3000"),
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    API_PREFIX: process.env.API_PREFIX || "/api/v1",
};
