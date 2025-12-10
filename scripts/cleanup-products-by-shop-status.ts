import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductModel from "../src/models/ProductModal";
import ShopModel, { ShopStatus } from "../src/models/ShopModel";

// Load environment variables FIRST
dotenv.config();

// ============================================
// CẤU HÌNH MONGODB - Có thể set trực tiếp ở đây
// ============================================
// Nếu để empty string "", script sẽ lấy từ biến môi trường MONGODB_URI
// Ví dụ: "mongodb://localhost:27017/mylove" hoặc "mongodb+srv://user:pass@cluster.mongodb.net/dbname"
const MONGODB_URI = "mongodb+srv://thu601925_db_user:m7EyEOeLez1YIk0Q@cluster0.ayg2z2y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

/**
 * Script để xử lý sản phẩm dựa trên trạng thái shop:
 * - Xóa sản phẩm nếu shop không còn tồn tại (đã bị xóa)
 * - Ẩn sản phẩm (set isActive = false) nếu shop bị khóa (status = BLOCKED)
 */
async function cleanupProductsByShopStatus() {
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

    // Lấy tất cả sản phẩm
    console.log("📦 Fetching all products...");
    const products = await ProductModel.find({}).select("_id name shopId isActive").lean();
    console.log(`   Found ${products.length} products\n`);

    // Lấy tất cả shop IDs và status để tối ưu truy vấn
    console.log("🏪 Fetching all shops...");
    const shops = await ShopModel.find({}).select("_id status").lean();
    const shopMap = new Map<string, { id: string; status: string }>();
    shops.forEach((shop) => {
      shopMap.set(shop._id.toString(), {
        id: shop._id.toString(),
        status: shop.status,
      });
    });
    console.log(`   Found ${shops.length} shops\n`);

    let deletedCount = 0;
    let hiddenCount = 0;
    let unchangedCount = 0;
    const deletedProducts: Array<{ id: string; name: string; reason: string }> = [];
    const hiddenProducts: Array<{ id: string; name: string; shopId: string }> = [];
    const productIdsToDelete: mongoose.Types.ObjectId[] = [];
    const productIdsToHide: mongoose.Types.ObjectId[] = [];

    console.log("🔍 Processing products...\n");

    for (const product of products) {
      const shopId = product.shopId.toString();
      const shop = shopMap.get(shopId);

      if (!shop) {
        // Shop không tồn tại → xóa sản phẩm
        productIdsToDelete.push(product._id as mongoose.Types.ObjectId);
        deletedProducts.push({
          id: product._id.toString(),
          name: product.name,
          reason: "Shop không tồn tại (đã bị xóa)",
        });
        deletedCount++;
      } else if (shop.status === ShopStatus.BLOCKED) {
        // Shop bị khóa → ẩn sản phẩm
        if (product.isActive) {
          productIdsToHide.push(product._id as mongoose.Types.ObjectId);
          hiddenProducts.push({
            id: product._id.toString(),
            name: product.name,
            shopId: shopId,
          });
          hiddenCount++;
        } else {
          unchangedCount++;
        }
      } else {
        // Shop tồn tại và không bị khóa → không làm gì
        unchangedCount++;
      }
    }

    // Xóa sản phẩm theo batch
    if (productIdsToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${productIdsToDelete.length} products with non-existent shops...`);
      await ProductModel.deleteMany({ _id: { $in: productIdsToDelete } });
      deletedProducts.forEach((p) => {
        console.log(`   ❌ Deleted: "${p.name}" - ${p.reason}`);
      });
    }

    // Ẩn sản phẩm theo batch
    if (productIdsToHide.length > 0) {
      console.log(`\n🔒 Hiding ${productIdsToHide.length} products from blocked shops...`);
      await ProductModel.updateMany(
        { _id: { $in: productIdsToHide } },
        { $set: { isActive: false } }
      );
      hiddenProducts.forEach((p) => {
        console.log(`   🔒 Hidden: "${p.name}" (Shop ID: ${p.shopId})`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Cleanup Summary:");
    console.log("=".repeat(60));
    console.log(`   ❌ Deleted products (shop không tồn tại): ${deletedCount}`);
    console.log(`   🔒 Hidden products (shop bị khóa): ${hiddenCount}`);
    console.log(`   ✅ Unchanged products: ${unchangedCount}`);
    console.log(`   📦 Total processed: ${products.length}`);

    if (deletedProducts.length > 0) {
      console.log("\n📋 Deleted Products:");
      deletedProducts.forEach((p, index) => {
        console.log(`   ${index + 1}. [${p.id}] ${p.name} - ${p.reason}`);
      });
    }

    if (hiddenProducts.length > 0) {
      console.log("\n📋 Hidden Products:");
      hiddenProducts.forEach((p, index) => {
        console.log(`   ${index + 1}. [${p.id}] ${p.name} (Shop ID: ${p.shopId})`);
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
cleanupProductsByShopStatus();
