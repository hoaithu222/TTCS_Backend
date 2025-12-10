import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel, { UserStatus } from "../src/models/UserModel";
import ShopModel, { ShopStatus } from "../src/models/ShopModel";
import ProductModel from "../src/models/ProductModal";

// Load environment variables FIRST
dotenv.config();

// ============================================
// CẤU HÌNH MONGODB - Có thể set trực tiếp ở đây
// ============================================
// Nếu để empty string "", script sẽ lấy từ biến môi trường MONGODB_URI
// Ví dụ: "mongodb://localhost:27017/mylove" hoặc "mongodb+srv://user:pass@cluster.mongodb.net/dbname"
const MONGODB_URI = "mongodb+srv://thu601925_db_user:m7EyEOeLez1YIk0Q@cluster0.ayg2z2y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

/**
 * Script để xử lý shop và sản phẩm dựa trên trạng thái user:
 * - Khóa shop và ẩn sản phẩm nếu user bị khóa (status = INACTIVE)
 * - Mở khóa shop và hiện lại sản phẩm nếu user được mở khóa (status = ACTIVE)
 */
async function cleanupShopsByUserStatus() {
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

    // Lấy tất cả users có shop
    console.log("👥 Fetching users with shops...");
    const usersWithShops = await UserModel.find({}).select("_id name email status").lean();
    console.log(`   Found ${usersWithShops.length} users\n`);

    // Lấy tất cả shops để tối ưu truy vấn
    console.log("🏪 Fetching all shops...");
    const shops = await ShopModel.find({}).select("_id userId status isActive").lean();
    const shopMap = new Map<string, { id: string; status: string; isActive: boolean }>();
    shops.forEach((shop) => {
      if (shop.userId) {
        shopMap.set(shop.userId.toString(), {
          id: shop._id.toString(),
          status: shop.status,
          isActive: shop.isActive || false,
        });
      }
    });
    console.log(`   Found ${shops.length} shops\n`);

    let blockedShopsCount = 0;
    let unlockedShopsCount = 0;
    let hiddenProductsCount = 0;
    let shownProductsCount = 0;
    let unchangedCount = 0;
    const blockedShops: Array<{ userId: string; userName: string; shopId: string }> = [];
    const unlockedShops: Array<{ userId: string; userName: string; shopId: string }> = [];

    console.log("🔍 Processing users...\n");

    for (const user of usersWithShops) {
      const userId = user._id.toString();
      const shop = shopMap.get(userId);

      if (!shop) {
        // User không có shop → bỏ qua
        unchangedCount++;
        continue;
      }

      if (user.status === UserStatus.INACTIVE) {
        // User bị khóa → khóa shop và ẩn sản phẩm
        if (shop.status !== ShopStatus.BLOCKED || shop.isActive) {
          await ShopModel.findByIdAndUpdate(shop.id, {
            status: ShopStatus.BLOCKED,
            isActive: false,
          });
          blockedShopsCount++;
          blockedShops.push({
            userId: userId,
            userName: user.name || user.email,
            shopId: shop.id,
          });
        }

        // Ẩn sản phẩm nếu chưa bị ẩn
        const hiddenProducts = await ProductModel.updateMany(
          { shopId: shop.id, isActive: true },
          { $set: { isActive: false } }
        );
        if (hiddenProducts.modifiedCount > 0) {
          hiddenProductsCount += hiddenProducts.modifiedCount;
          console.log(`   🔒 User "${user.name || user.email}" (${userId}) - Blocked shop ${shop.id}, hidden ${hiddenProducts.modifiedCount} products`);
        }
      } else if (user.status === UserStatus.ACTIVE) {
        // User đang active → mở khóa shop và hiện lại sản phẩm nếu shop đang bị khóa
        if (shop.status === ShopStatus.BLOCKED || !shop.isActive) {
          await ShopModel.findByIdAndUpdate(shop.id, {
            status: ShopStatus.ACTIVE,
            isActive: true,
          });
          unlockedShopsCount++;
          unlockedShops.push({
            userId: userId,
            userName: user.name || user.email,
            shopId: shop.id,
          });
        }

        // Hiện lại sản phẩm nếu shop đã được mở khóa
        if (shop.status === ShopStatus.BLOCKED || !shop.isActive) {
          const shownProducts = await ProductModel.updateMany(
            { shopId: shop.id, isActive: false },
            { $set: { isActive: true } }
          );
          if (shownProducts.modifiedCount > 0) {
            shownProductsCount += shownProducts.modifiedCount;
            console.log(`   ✅ User "${user.name || user.email}" (${userId}) - Unlocked shop ${shop.id}, shown ${shownProducts.modifiedCount} products`);
          }
        } else {
          unchangedCount++;
        }
      } else {
        unchangedCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Cleanup Summary:");
    console.log("=".repeat(60));
    console.log(`   🔒 Blocked shops (user inactive): ${blockedShopsCount}`);
    console.log(`   ✅ Unlocked shops (user active): ${unlockedShopsCount}`);
    console.log(`   🔒 Hidden products: ${hiddenProductsCount}`);
    console.log(`   ✅ Shown products: ${shownProductsCount}`);
    console.log(`   ⏭️  Unchanged: ${unchangedCount}`);
    console.log(`   👥 Total processed: ${usersWithShops.length}`);

    if (blockedShops.length > 0) {
      console.log("\n📋 Blocked Shops (User Inactive):");
      blockedShops.forEach((s, index) => {
        console.log(`   ${index + 1}. User: "${s.userName}" (${s.userId}) - Shop: ${s.shopId}`);
      });
    }

    if (unlockedShops.length > 0) {
      console.log("\n📋 Unlocked Shops (User Active):");
      unlockedShops.forEach((s, index) => {
        console.log(`   ${index + 1}. User: "${s.userName}" (${s.userId}) - Shop: ${s.shopId}`);
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
cleanupShopsByUserStatus();
