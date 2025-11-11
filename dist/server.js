"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const connections_1 = require("./shared/config/connections");
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const server = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: CORS_ORIGIN,
        credentials: true,
    },
});
// Socket.io handler
const sockets_1 = __importDefault(require("./sockets"));
(0, sockets_1.default)(io);
// Initialize database connections
const initializeServer = async () => {
    try {
        // Check all database connections (do not block server startup in dev)
        const connectionsOk = await (0, connections_1.checkConnections)();
        if (!connectionsOk) {
            console.warn("⚠️ Database connection failed. Starting server anyway (dev mode).");
        }
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`📡 Socket.io server ready`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        });
    }
    catch (error) {
        console.error("❌ Server initialization failed:", error);
        process.exit(1);
    }
};
initializeServer();
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    try {
        await (0, connections_1.closeConnections)();
        server.close(() => {
            console.log("Process terminated");
            process.exit(0);
        });
    }
    catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
