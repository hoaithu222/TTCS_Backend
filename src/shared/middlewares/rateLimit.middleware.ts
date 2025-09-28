import { Request, Response, NextFunction } from "express";

// Simple in-memory rate limiting (for production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    const clientData = requestCounts.get(clientIP);

    if (!clientData || now > clientData.resetTime) {
      // First request or window expired
      requestCounts.set(clientIP, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
    } else if (clientData.count < maxRequests) {
      // Within limit
      clientData.count++;
      next();
    } else {
      // Rate limit exceeded
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }
  };
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute
