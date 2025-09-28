import { Request, Response, NextFunction, RequestHandler } from "express";
import { env } from "../config/env.config";
import Jwt, { JwtAccessPayload } from "../utils/jwt";
import UserModel from "../../models/UserModel";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authorize = (roles: string[] = []): RequestHandler => {
  return (req, res, next) => {
    const currentUser = (req as any).currentUser as
      | { role?: string }
      | undefined;
    if (!currentUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (
      roles.length > 0 &&
      currentUser.role &&
      !roles.includes(currentUser.role)
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};

export const authenticateToken: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = Jwt.verifyAccessToken<JwtAccessPayload>(token);
    // Load full user from DB once to attach richer context
    const user = await UserModel.findById(decoded.userId).select(
      "_id email name role status avatar"
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    (req as any).user = {
      userId: user.id.toString(),
      email: user.email,
    } as any;
    // Attach full user object for downstream handlers
    (req as any).currentUser = user;

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = Jwt.verifyAccessToken<JwtAccessPayload>(token);
      const user = await UserModel.findById(decoded.userId).select(
        "_id email name role status avatar"
      );
      if (user) {
        (req as any).user = {
          userId: user.id.toString(),
          email: user.email,
        } as any;
        (req as any).currentUser = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
