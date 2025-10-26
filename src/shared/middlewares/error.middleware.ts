import { Request, Response, NextFunction } from "express";
import { ResponseUtil } from "../utils/response.util";
import { AppError, NotFoundError } from "../utils/errors.util";

export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
  if (error instanceof AppError) {
    // Skip toast for authentication-related errors (401, 403)
    const skipToast = error.statusCode === 401 || error.statusCode === 403;

    return ResponseUtil.error(
      res,
      error.message,
      error.statusCode,
      error.errors,
      req.path,
      req.method,
      undefined, // code
      skipToast
    );
  }

  // Handle validation errors from express-validator
  if (error.name === "ValidationError") {
    return ResponseUtil.validationError(
      res,
      [], // You can extract validation errors here
      error.message
    );
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    return ResponseUtil.error(
      res,
      "Invalid token",
      401,
      undefined,
      req.path,
      req.method,
      undefined,
      true
    );
  }

  if (error.name === "TokenExpiredError") {
    return ResponseUtil.error(
      res,
      "Token expired",
      401,
      undefined,
      req.path,
      req.method,
      undefined,
      true
    );
  }

  // Handle database errors
  if (
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeUniqueConstraintError" ||
    error.name === "MongoError"
  ) {
    return ResponseUtil.badRequest(res, "Database operation failed");
  }

  // Handle network errors
  if (error.name === "ECONNREFUSED" || error.name === "ENOTFOUND") {
    return ResponseUtil.error(res, "Service temporarily unavailable", 503);
  }

  // Default error handling - never expose 500 errors to client
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    return ResponseUtil.error(
      res,
      error.message,
      500,
      undefined,
      req.path,
      req.method
    );
  } else {
    // In production, never expose internal errors
    return ResponseUtil.error(
      res,
      "Something went wrong. Please try again later.",
      500,
      undefined,
      req.path,
      req.method
    );
  }
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(
    `Route not found - ${req.method} ${req.originalUrl}`
  );
  next(error);
};

// Global error handler for unhandled rejections
export const handleUnhandledRejection = (
  reason: any,
  promise: Promise<any>
) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
};

// Global error handler for uncaught exceptions
export const handleUncaughtException = (error: Error) => {
  console.error("Uncaught Exception:", error);
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
};
