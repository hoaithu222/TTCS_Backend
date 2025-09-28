"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const env_config_1 = require("./shared/config/env.config");
const error_middleware_1 = require("./shared/middlewares/error.middleware");
const swagger_1 = require("./shared/config/swagger");
const rateLimit_middleware_1 = require("./shared/middlewares/rateLimit.middleware");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: env_config_1.env.CORS_ORIGIN,
    credentials: true,
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Cookie parser
app.use((0, cookie_parser_1.default)());
// Logging middleware
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
else {
    app.use((0, morgan_1.default)("combined"));
}
// Swagger Documentation
app.use("/api-docs", swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.specs));
// Rate limiting
app.use((0, rateLimit_middleware_1.rateLimit)(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
// API Routes with prefix
app.use(env_config_1.env.API_PREFIX, routes_1.default);
// Error handling middleware
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
// Global error handlers
process.on("unhandledRejection", error_middleware_1.handleUnhandledRejection);
process.on("uncaughtException", error_middleware_1.handleUncaughtException);
exports.default = app;
