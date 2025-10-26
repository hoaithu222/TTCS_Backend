import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
  code?: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  path?: string;
  method?: string;
  code?: number;
  skipToast?: boolean; // Flag to skip toast notification in front-end
}

export class ResponseUtil {
  static buildPaginationMeta(page: number, limit: number, total: number) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return { page: safePage, limit: safeLimit, total, totalPages };
  }
  static success<T>(
    res: Response,
    data?: T,
    message: string = "Success",
    statusCode: number = 200,
    code: number = 1,
    meta?: any
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
      code,
    };

    res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string = "Error occurred",
    statusCode: number = 400,
    errors?: Array<{ field: string; message: string }>,
    path?: string,
    method?: string,
    code?: number,
    skipToast?: boolean
  ): void {
    const response: ErrorResponse = {
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

  static created<T>(
    res: Response,
    data?: T,
    message: string = "Resource created successfully"
  ): void {
    this.success(res, data, message, 201);
  }

  static notFound(res: Response, message: string = "Resource not found"): void {
    this.error(res, message, 404);
  }

  static badRequest(
    res: Response,
    message: string = "Bad request",
    errors?: Array<{ field: string; message: string }>
  ): void {
    this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message: string = "Unauthorized"): void {
    this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = "Forbidden"): void {
    this.error(res, message, 403);
  }

  static conflict(res: Response, message: string = "Conflict"): void {
    this.error(res, message, 409);
  }

  static tooManyRequests(
    res: Response,
    message: string = "Too many requests",
    retryAfter?: number
  ): void {
    const response: ErrorResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (retryAfter) {
      res.set("Retry-After", retryAfter.toString());
    }

    res.status(429).json(response);
  }

  static internalServerError(
    res: Response,
    message: string = "Internal server error"
  ): void {
    this.error(res, message, 500);
  }

  static validationError(
    res: Response,
    errors: Array<{ field: string; message: string }>,
    message: string = "Validation failed"
  ): void {
    this.error(res, message, 422, errors);
  }
}
