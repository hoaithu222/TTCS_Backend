import mongoose from "mongoose";
import dotenv from "dotenv";
import ChatConversationModel from "../src/models/ChatConversation";
import ChatMessageModel from "../src/models/ChatMessage";

// Load environment variables
dotenv.config();

// ============================================
// CẤU HÌNH
// ============================================
// MongoDB URI - Lấy từ .env hoặc đặt trực tiếp ở đây
const MONGODB_URI = process.env.MONGODB_URI || "";

// ID của conversation cần xóa
const CONVERSATION_ID = "6961ec7611a2eaa073cd8b61";

/**
 * Script để xóa một cuộc hội thoại cụ thể và tất cả tin nhắn liên quan
 */
async function deleteConversation() {
  try {
    // Validate MongoDB URI
    if (!MONGODB_URI || MONGODB_URI.trim() === "") {
      throw new Error(
        "❌ MONGODB_URI is not set. Please configure it in .env file."
      );
    }

    console.log("🔌 Connecting to MongoDB...");
    console.log(`   URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}\n`);
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Connected to MongoDB successfully!\n");
    console.log("=".repeat(60));
    console.log("🗑️  DELETE CONVERSATION SCRIPT");
    console.log("=".repeat(60));
    console.log(`\n📝 Conversation ID to delete: ${CONVERSATION_ID}\n`);

    // Validate conversation ID
    if (!mongoose.Types.ObjectId.isValid(CONVERSATION_ID)) {
      throw new Error(`❌ Invalid conversation ID: ${CONVERSATION_ID}`);
    }

    // Check if conversation exists
    const conversation = await ChatConversationModel.findById(CONVERSATION_ID);
    
    if (!conversation) {
      console.log(`⚠️  Conversation not found: ${CONVERSATION_ID}`);
      console.log(`   This conversation may have been already deleted.\n`);
      return;
    }

    console.log(`✅ Found conversation:`);
    console.log(`   ID: ${conversation._id}`);
    console.log(`   Created: ${conversation.createdAt}`);
    console.log(`   Updated: ${conversation.updatedAt}\n`);

    // Count messages in this conversation
    const messageCount = await ChatMessageModel.countDocuments({
      conversationId: CONVERSATION_ID,
    });

    console.log(`📨 Found ${messageCount} messages in this conversation\n`);

    // Ask for confirmation (in production, you might want to skip this)
    console.log("🔥 Starting deletion process...\n");

    // Step 1: Delete all messages
    console.log("Step 1️⃣: Deleting messages...");
    const deletedMessages = await ChatMessageModel.deleteMany({
      conversationId: CONVERSATION_ID,
    });
    console.log(`   ✅ Deleted ${deletedMessages.deletedCount} messages\n`);

    // Step 2: Delete conversation
    console.log("Step 2️⃣: Deleting conversation...");
    await ChatConversationModel.findByIdAndDelete(CONVERSATION_ID);
    console.log(`   ✅ Deleted conversation: ${CONVERSATION_ID}\n`);

    console.log("=".repeat(60));
    console.log("✅ DELETION COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\nSummary:`);
    console.log(`   - Conversation deleted: 1`);
    console.log(`   - Messages deleted: ${deletedMessages.deletedCount}\n`);

  } catch (error) {
    console.error("\n❌ ERROR occurred:");
    console.error(error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("🔌 MongoDB connection closed.\n");
    }
  }
}

// Run the script
deleteConversation()
  .then(() => {
    console.log("✅ Script finished successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
