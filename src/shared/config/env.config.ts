// Ensure environment variables are loaded as early as possible
import dotenv from "dotenv";
dotenv.config();

// Environment configuration
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000"),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  API_PREFIX: process.env.API_PREFIX || "/api/v1",
};
