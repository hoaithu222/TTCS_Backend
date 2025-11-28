// Ensure environment variables are loaded as early as possible
import dotenv from "dotenv";
dotenv.config();

// Environment configuration
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000"),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  // Support multiple CORS origins via comma-separated list or indexed vars
  CORS_ORIGINS: [
    ...(process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []),
    ...(process.env.CORS_ORIGIN_1 ? [process.env.CORS_ORIGIN_1] : []),
    ...(process.env.CORS_ORIGIN_2 ? [process.env.CORS_ORIGIN_2] : []),
  ],
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  API_PREFIX: process.env.API_PREFIX || "/api/v1",
  APP_NAME: process.env.APP_NAME || "Bán hàng",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.EMAIL_USER || process.env.SMTP_USER || "",
  SMTP_PASS: process.env.EMAIL_PASS || process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.EMAIL_USER || process.env.SMTP_USER || "",
};
