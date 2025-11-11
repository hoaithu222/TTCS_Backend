"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static buildPaginationMeta(page, limit, total) {
        const safePage = Number.isFinite(page) && page > 0 ? page : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
        const totalPages = Math.max(1, Math.ceil(total / safeLimit));
        return { page: safePage, limit: safeLimit, total, totalPages };
    }
    static success(res, data, message = "Success", statusCode = 200, code = 1, meta) {
        const response = {
            success: true,
            message,
            data,
            meta,
            timestamp: new Date().toISOString(),
            code,
        };
        res.status(statusCode).json(response);
    }
    static error(res, message = "Error occurred", statusCode = 400, errors, path, method, code, skipToast) {
        const response = {
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString(),
            path,
            method,
            code,
            skipToast,
        };
        res.status(statusCode).json(response);
    }
    static created(res, data, message = "Resource created successfully") {
        this.success(res, data, message, 201);
    }
    static notFound(res, message = "Resource not found") {
        this.error(res, message, 404);
    }
    static badRequest(res, message = "Bad request", errors) {
        this.error(res, message, 400, errors);
    }
    static unauthorized(res, message = "Unauthorized") {
        this.error(res, message, 401);
    }
    static forbidden(res, message = "Forbidden") {
        this.error(res, message, 403);
    }
    static conflict(res, message = "Conflict") {
        this.error(res, message, 409);
    }
    static tooManyRequests(res, message = "Too many requests", retryAfter) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        };
        if (retryAfter) {
            res.set("Retry-After", retryAfter.toString());
        }
        res.status(429).json(response);
    }
    static internalServerError(res, message = "Internal server error") {
        this.error(res, message, 500);
    }
    static validationError(res, errors, message = "Validation failed") {
        this.error(res, message, 422, errors);
    }
}
exports.ResponseUtil = ResponseUtil;
