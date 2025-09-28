import mongoose from "mongoose";
import { mongoConfig } from "./database";

// MongoDB Connection
export const mongoConnection = mongoose.connect(
  mongoConfig.uri,
  mongoConfig.options
);

// Connection status check
export const checkConnections = async () => {
  try {
    // Test MongoDB only
    await mongoConnection;
    console.log("✅ MongoDB connected successfully");

    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Graceful shutdown
export const closeConnections = async () => {
  try {
    await mongoose.disconnect();
    console.log("✅ All database connections closed");
  } catch (error) {
    console.error("❌ Error closing connections:", error);
  }
};
