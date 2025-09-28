import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env.config";

export interface JwtAccessPayload {
  userId: string;
  email?: string;
}

export default class Jwt {
  static generateAccessToken(payload: JwtAccessPayload): string {
    const secret: Secret = env.JWT_SECRET as unknown as Secret;
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions;
    return jwt.sign(payload, secret, options);
  }

  static generateRefreshToken(): string {
    const payload = {
      value:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
    };
    const secret: Secret = env.JWT_SECRET as unknown as Secret;
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions;
    return jwt.sign(payload, secret, options);
  }
  static verifyAccessToken<T = any>(token: string): T {
    try {
      const secret: Secret = env.JWT_SECRET as unknown as Secret;
      return jwt.verify(token, secret) as T;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}
