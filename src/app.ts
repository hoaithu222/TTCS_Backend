import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import routes from "./routes";
import { env } from "./shared/config/env.config";
import passport from "passport";
import {
  errorHandler,
  notFound,
  handleUnhandledRejection,
  handleUncaughtException,
} from "./shared/middlewares/error.middleware";
import { swaggerUi, specs, swaggerUiOptions } from "./shared/config/swagger";
import { rateLimit } from "./shared/middlewares/rateLimit.middleware";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration (allow Swagger UI and local dev)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        env.CORS_ORIGIN,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ].filter(Boolean);
      if (!origin) {
        return callback(null, true);
      }
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      // In development, allow all origins to avoid Swagger CORS issues
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Passport (social auth)
app.use(passport.initialize());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Swagger Documentation (serve local swagger-ui-dist assets to satisfy CSP/MIME)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// Rate limiting
app.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Root route (hello world)
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello world", success: true });
});

// API Routes with prefix
app.use(env.API_PREFIX, routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Global error handlers
process.on("unhandledRejection", handleUnhandledRejection);
process.on("uncaughtException", handleUncaughtException);

export default app;
