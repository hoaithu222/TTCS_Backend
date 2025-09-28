import http from "http";
import app from "./app";
import { Server } from "socket.io";
import {
  checkConnections,
  closeConnections,
} from "./shared/config/connections";

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});

// Socket.io handler
import socketHandler from "./sockets";
socketHandler(io);

// Initialize database connections
const initializeServer = async () => {
  try {
    // Check all database connections (do not block server startup in dev)
    const connectionsOk = await checkConnections();

    if (!connectionsOk) {
      console.warn(
        "⚠️ Database connection failed. Starting server anyway (dev mode)."
      );
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📡 Socket.io server ready`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("❌ Server initialization failed:", error);
    process.exit(1);
  }
};

initializeServer();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully`);

  try {
    await closeConnections();
    server.close(() => {
      console.log("Process terminated");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
