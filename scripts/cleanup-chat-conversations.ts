import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../src/models/UserModel";
import ShopModel from "../src/models/ShopModel";
import ChatConversationModel from "../src/models/ChatConversation";
import ChatMessageModel from "../src/models/ChatMessage";

// Load environment variables FIRST
dotenv.config();

// ============================================
// CẤU HÌNH MONGODB - Có thể set trực tiếp ở đây
// ============================================
// Nếu để empty string "", script sẽ lấy từ biến môi trường MONGODB_URI
// Ví dụ: "mongodb://localhost:27017/mylove" hoặc "mongodb+srv://user:pass@cluster.mongodb.net/dbname"
const MONGODB_URI = "mongodb+srv://thu601925_db_user:m7EyEOeLez1YIk0Q@cluster0.ayg2z2y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

/**
 * Script để xử lý conversations và messages:
 * - Xóa conversations của user không tồn tại
 * - Xóa conversations của shop không tồn tại
 * - Xóa messages của conversations đã bị xóa
 */
async function cleanupChatConversations() {
  try {
    // Lấy MongoDB URI từ cấu hình trực tiếp hoặc env
    const mongoUri = MONGODB_URI.trim() || process.env.MONGODB_URI || "";

    // Validate MongoDB URI
    if (!mongoUri || mongoUri.trim() === "") {
      throw new Error(
        "❌ MONGODB_URI is not set or empty. Please configure it in this file or .env file."
      );
    }

    if (
      !mongoUri.startsWith("mongodb://") &&
      !mongoUri.startsWith("mongodb+srv://")
    ) {
      throw new Error(
        `❌ Invalid MONGODB_URI format. Expected "mongodb://" or "mongodb+srv://", got: ${mongoUri.substring(0, 20)}...`
      );
    }

    console.log("🔌 Connecting to MongoDB...");
    console.log(`   URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}\n`); // Ẩn password trong log
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB\n");

    // Lấy tất cả users và shops để tối ưu truy vấn
    console.log("👥 Fetching all users...");
    const users = await UserModel.find({}).select("_id").lean();
    const userIdSet = new Set(users.map((u) => u._id.toString()));
    console.log(`   Found ${users.length} users\n`);

    console.log("🏪 Fetching all shops...");
    const shops = await ShopModel.find({}).select("_id").lean();
    const shopIdSet = new Set(shops.map((s) => s._id.toString()));
    console.log(`   Found ${shops.length} shops\n`);

    // Lấy tất cả conversations
    console.log("💬 Fetching all conversations...");
    const conversations = await ChatConversationModel.find({}).select("_id participants metadata").lean();
    console.log(`   Found ${conversations.length} conversations\n`);

    let deletedConversationsCount = 0;
    let deletedMessagesCount = 0;
    const conversationsToDelete: mongoose.Types.ObjectId[] = [];
    const deletedConversationsInfo: Array<{ id: string; reason: string }> = [];

    console.log("🔍 Processing conversations...\n");

    for (const conversation of conversations) {
      let shouldDelete = false;
      let reason = "";

      // Kiểm tra participants - nếu có user không tồn tại thì xóa
      if (conversation.participants && Array.isArray(conversation.participants)) {
        for (const participant of conversation.participants) {
          if (participant.userId) {
            const userId = participant.userId.toString();
            if (!userIdSet.has(userId)) {
              shouldDelete = true;
              reason = `User ${userId} không tồn tại`;
              break;
            }
          }
        }
      }

      // Kiểm tra metadata - nếu có shopId hoặc targetId không tồn tại thì xóa
      if (!shouldDelete && conversation.metadata) {
        const metadata = conversation.metadata as any;
        if (metadata.shopId) {
          const shopId = metadata.shopId.toString();
          if (!shopIdSet.has(shopId)) {
            shouldDelete = true;
            reason = `Shop ${shopId} không tồn tại (metadata.shopId)`;
          }
        }
        if (!shouldDelete && metadata.targetId) {
          const targetId = metadata.targetId.toString();
          // Kiểm tra xem targetId có phải là shopId không
          if (!shopIdSet.has(targetId) && !userIdSet.has(targetId)) {
            // Nếu không phải user và không phải shop thì có thể là shop đã bị xóa
            // Kiểm tra xem có phải là shop conversation không
            if (conversation.type === "shop" || conversation.channel === "shop") {
              shouldDelete = true;
              reason = `Shop ${targetId} không tồn tại (metadata.targetId)`;
            }
          }
        }
      }

      if (shouldDelete) {
        conversationsToDelete.push(conversation._id as mongoose.Types.ObjectId);
        deletedConversationsInfo.push({
          id: conversation._id.toString(),
          reason: reason,
        });
      }
    }

    // Xóa messages của conversations sẽ bị xóa
    if (conversationsToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${conversationsToDelete.length} conversations and their messages...`);
      
      const deletedMessages = await ChatMessageModel.deleteMany({
        conversationId: { $in: conversationsToDelete },
      });
      deletedMessagesCount = deletedMessages.deletedCount;
      console.log(`   ❌ Deleted ${deletedMessagesCount} messages`);

      // Xóa conversations
      const deletedConversations = await ChatConversationModel.deleteMany({
        _id: { $in: conversationsToDelete },
      });
      deletedConversationsCount = deletedConversations.deletedCount;
      console.log(`   ❌ Deleted ${deletedConversationsCount} conversations`);

      deletedConversationsInfo.forEach((info, index) => {
        console.log(`   ${index + 1}. Conversation ${info.id} - ${info.reason}`);
      });
    }

    // Kiểm tra và xóa messages của conversations không tồn tại (orphaned messages)
    console.log("\n🔍 Checking for orphaned messages...");
    const allConversationIds = await ChatConversationModel.find({}).select("_id").lean();
    const existingConversationIds = new Set(
      allConversationIds.map((c) => c._id.toString())
    );

    const orphanedMessages = await ChatMessageModel.find({}).select("conversationId").lean();
    const orphanedMessageIds: mongoose.Types.ObjectId[] = [];

    for (const message of orphanedMessages) {
      const conversationId = message.conversationId.toString();
      if (!existingConversationIds.has(conversationId)) {
        orphanedMessageIds.push(message._id as mongoose.Types.ObjectId);
      }
    }

    if (orphanedMessageIds.length > 0) {
      console.log(`\n🗑️  Deleting ${orphanedMessageIds.length} orphaned messages...`);
      const deletedOrphanedMessages = await ChatMessageModel.deleteMany({
        _id: { $in: orphanedMessageIds },
      });
      deletedMessagesCount += deletedOrphanedMessages.deletedCount;
      console.log(`   ❌ Deleted ${deletedOrphanedMessages.deletedCount} orphaned messages`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Cleanup Summary:");
    console.log("=".repeat(60));
    console.log(`   ❌ Deleted conversations: ${deletedConversationsCount}`);
    console.log(`   ❌ Deleted messages: ${deletedMessagesCount}`);
    console.log(`   💬 Total conversations processed: ${conversations.length}`);

    if (deletedConversationsInfo.length > 0) {
      console.log("\n📋 Deleted Conversations:");
      deletedConversationsInfo.forEach((info, index) => {
        console.log(`   ${index + 1}. [${info.id}] ${info.reason}`);
      });
    }

    console.log("\n✅ Cleanup completed successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chạy script
cleanupChatConversations();
