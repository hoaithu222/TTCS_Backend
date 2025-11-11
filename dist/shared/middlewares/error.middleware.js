"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUncaughtException = exports.handleUnhandledRejection = exports.notFound = exports.errorHandler = void 0;
const response_util_1 = require("../utils/response.util");
const errors_util_1 = require("../utils/errors.util");
const errorHandler = (error, req, res, next) => {
    // Log error for debugging
    console.error("Error:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
    });
    // Handle AppError instances
    if (error instanceof errors_util_1.AppError) {
        // Skip toast for authentication-related errors (401, 403)
        const skipToast = error.statusCode === 401 || error.statusCode === 403;
        return response_util_1.ResponseUtil.error(res, error.message, error.statusCode, error.errors, req.path, req.method, undefined, // code
        skipToast);
    }
    // Handle validation errors from express-validator
    if (error.name === "ValidationError") {
        return response_util_1.ResponseUtil.validationError(res, [], // You can extract validation errors here
        error.message);
    }
    // Handle JWT errors
    if (error.name === "JsonWebTokenError") {
        return response_util_1.ResponseUtil.error(res, "Invalid token", 401, undefined, req.path, req.method, undefined, true);
    }
    if (error.name === "TokenExpiredError") {
        return response_util_1.ResponseUtil.error(res, "Token expired", 401, undefined, req.path, req.method, undefined, true);
    }
    // Handle database errors
    if (error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError" ||
        error.name === "MongoError") {
        return response_util_1.ResponseUtil.badRequest(res, "Database operation failed");
    }
    // Handle network errors
    if (error.name === "ECONNREFUSED" || error.name === "ENOTFOUND") {
        return response_util_1.ResponseUtil.error(res, "Service temporarily unavailable", 503);
    }
    // Default error handling - never expose 500 errors to client
    const isDevelopment = process.env.NODE_ENV === "development";
    if (isDevelopment) {
        return response_util_1.ResponseUtil.error(res, error.message, 500, undefined, req.path, req.method);
    }
    else {
        // In production, never expose internal errors
        return response_util_1.ResponseUtil.error(res, "Something went wrong. Please try again later.", 500, undefined, req.path, req.method);
    }
};
exports.errorHandler = errorHandler;
const notFound = (req, res, next) => {
    const error = new errors_util_1.NotFoundError(`Route not found - ${req.method} ${req.originalUrl}`);
    next(error);
};
exports.notFound = notFound;
// Global error handler for unhandled rejections
const handleUnhandledRejection = (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // In production, you might want to exit the process
    if (process.env.NODE_ENV === "production") {
        process.exit(1);
    }
};
exports.handleUnhandledRejection = handleUnhandledRejection;
// Global error handler for uncaught exceptions
const handleUncaughtException = (error) => {
    console.error("Uncaught Exception:", error);
    // In production, you might want to exit the process
    if (process.env.NODE_ENV === "production") {
        process.exit(1);
    }
};
exports.handleUncaughtException = handleUncaughtException;
