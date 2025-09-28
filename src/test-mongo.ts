import mongoose from "mongoose";

const testMongoConnection = async () => {
  console.log("🔍 Testing MongoDB connection...");

  try {
    await mongoose.connect("mongodb://localhost:27017/mylove");

    console.log("✅ MongoDB connected successfully!");
    console.log("📊 Ready to use MongoDB");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

testMongoConnection();
