import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductModel from "../src/models/ProductModal";
import CategoryModel from "../src/models/CategoryModel";
import SubCategoryModel from "../src/models/SubCategoryModel";
import { mongoConfig } from "../src/shared/config/database";
import {
  AttributeCollector,
  collectVariantAttributes,
  syncCollectedVariantAttributes,
} from "./helpers/variant-attribute.helper";

dotenv.config();

const SHOP_ID = "691ea157ee081107061fd446";

type VariantSeed = {
  attributes: Record<string, string>;
  priceOffset?: number;
  stock?: number;
  sku: string;
  imageUrl?: string;
};

type ProductSeed = {
  name: string;
  description: string;
  categoryName: string;
  subCategoryName: string;
  price: number;
  discount?: number;
  stock: number;
  rating?: number;
  salesCount?: number;
  warrantyInfo?: string;
  weightKg?: number;
  dimensions?: string;
  metaKeywords?: string[];
  isActive?: boolean;
  variants?: VariantSeed[];
  imageObjectIds: string[];
};

const products: ProductSeed[] = [
  {
    name: "Điện thoại Apple iPhone 15 128GB",
    description: `Thông số kỹ thuật:

- 6.1″ Super Retina XDR
- Khung nhôm, mặt kính pha màu
- Dynamic Island, chip A16 Bionic GPU 5 lõi
- SOS Khẩn Cấp, Phát hiện va chạm
- Thời lượng pin xem video tới 26 giờ, USB‑C chuẩn USB 2

Camera:
- Chính 48MP + Ultra Wide 12MP
- Ảnh 24MP/48MP, chân dung Focus & Depth
- Thu phóng quang học 4x

Bộ sản phẩm: Điện thoại, dây sạc USB-C, HDSD bảo hành điện tử 12 tháng.

Chính sách bảo hành:
- Kích hoạt tại https://checkcoverage.apple.com
- Tra cứu TTBH: https://getsupport.apple.com/repair-locations?locale=vi_VN
- Điều khoản chung: https://www.apple.com/legal/warranty/products/warranty-rest-of-apac-vietnamese.html
- Phụ kiện: https://www.apple.com/legal/warranty/products/accessory-warranty-vietnam.html

Khuyến nghị khách quay video mở hộp để hỗ trợ xử lý khiếu nại.`,
    categoryName: "Điện thoại - Smartphone",
    subCategoryName: "iPhone (iOS)",
    price: 21000000,
    discount: 1000000,
    stock: 24,
    rating: 4.9,
    salesCount: 180,
    warrantyInfo: "Bảo hành chính hãng 12 tháng.",
    weightKg: 0.187,
    dimensions: "147.6 x 71.6 x 7.8 mm",
    metaKeywords: ["iphone 15", "apple smartphone", "techzone"],
    imageObjectIds: ["691ece0c95a3f51657e8a9ab"],
    variants: [
      {
        attributes: { màu: "Đen Midnight", dung_lượng: "128GB" },
        sku: "IP15-128-MID",
        stock: 8,
      },
      {
        attributes: { màu: "Hồng", dung_lượng: "128GB" },
        sku: "IP15-128-PNK",
        stock: 8,
      },
    ],
  },
  {
    name: "Pin sạc dự phòng Anker PowerCore 30K PD",
    description:
      "Pin sạc dự phòng dung lượng 30.000mAh hỗ trợ Power Delivery 30W, 2 cổng USB-C + USB-A, lõi Li-ion an toàn, vỏ chống cháy nổ V0.",
    categoryName: "Phụ kiện điện tử",
    subCategoryName: "Pin sạc dự phòng",
    price: 1790000,
    discount: 190000,
    stock: 60,
    rating: 4.7,
    salesCount: 95,
    warrantyInfo: "Bảo hành chính hãng 18 tháng Anker tại Việt Nam.",
    weightKg: 0.55,
    dimensions: "153 x 72 x 27 mm",
    metaKeywords: ["anker powercore", "pin du phong pd"],
    imageObjectIds: ["691813e01ab3eeb8964eb247"],
    variants: [
      {
        attributes: { màu: "Đen", công_suất: "30W" },
        sku: "ANK-30K-BLK",
        stock: 30,
      },
    ],
  },
  {
    name: "Apple Watch Series 9 GPS 45mm",
    description:
      "Apple Watch Series 9 màn hình Retina luôn bật 2000 nits, chip S9 SiP hỗ trợ Double Tap, cảm biến sức khỏe đầy đủ, watchOS 10.",
    categoryName: "Đồng hồ thông minh - Smartwatch",
    subCategoryName: "Apple Watch",
    price: 12990000,
    discount: 900000,
    stock: 35,
    rating: 4.8,
    salesCount: 75,
    warrantyInfo: "Bảo hành Apple 12 tháng toàn cầu.",
    weightKg: 0.039,
    dimensions: "45mm case, dây S/M",
    metaKeywords: ["apple watch s9", "smartwatch"],
    imageObjectIds: ["69181ac81ab3eeb8964eb60d"],
    variants: [
      {
        attributes: { dây: "Sport Band", màu: "Storm Blue" },
        sku: "AWS9-45-SB",
        stock: 18,
      },
      {
        attributes: { dây: "Sport Loop", màu: "Starlight" },
        sku: "AWS9-45-SL",
        stock: 12,
      },
    ],
  },
  {
    name: "ASUS Zenbook 14 OLED UX3405",
    description:
      "Ultrabook ASUS Zenbook 14 OLED UX3405 chip Intel Core Ultra 7, RAM 16GB LPDDR5X, SSD 1TB, màn OLED 3K 120Hz, chuẩn Intel Evo.",
    categoryName: "Laptop - Máy tính xách tay",
    subCategoryName: "Laptop Mỏng nhẹ (Ultrabook)",
    price: 36990000,
    discount: 2000000,
    stock: 20,
    rating: 4.8,
    salesCount: 40,
    warrantyInfo: "Bảo hành ASUS 24 tháng chính hãng.",
    weightKg: 1.2,
    dimensions: "312.4 x 220.1 x 14.9 mm",
    metaKeywords: ["zenbook 14 oled", "ultrabook intel ultra"],
    imageObjectIds: ["691c546412a530716f3a4864"],
    variants: [
      {
        attributes: { ram: "16GB", lưu_trữ: "1TB SSD" },
        sku: "UX3405-16-1T",
        stock: 10,
      },
      {
        attributes: { ram: "32GB", lưu_trữ: "1TB SSD" },
        sku: "UX3405-32-1T",
        stock: 5,
        priceOffset: 5000000,
      },
    ],
  },
  {
    name: "Tai nghe True Wireless Sony WF-1000XM5",
    description:
      "Tai nghe Sony WF-1000XM5 chip V2 mới, ANC thích ứng, driver Dynamic Driver X, hỗ trợ LDAC/Multipoint, pin 24 giờ.",
    categoryName: "Tai nghe - Âm thanh",
    subCategoryName: "Tai nghe True Wireless",
    price: 6990000,
    discount: 600000,
    stock: 70,
    rating: 4.8,
    salesCount: 130,
    warrantyInfo: "Bảo hành Sony 12 tháng.",
    weightKg: 0.015,
    dimensions: "Hộp sạc 64.6 x 40 x 26.5 mm",
    metaKeywords: ["sony wf1000xm5", "tai nghe true wireless anc"],
    imageObjectIds: ["691c59fc1c277760d3623fad"],
    variants: [
      {
        attributes: { màu: "Đen" },
        sku: "WF1000XM5-BLK",
        stock: 35,
      },
      {
        attributes: { màu: "Bạc" },
        sku: "WF1000XM5-SLV",
        stock: 25,
      },
    ],
  },
];

async function seedProductsExtra() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log("✅ Connected to MongoDB");

    const { Types } = mongoose;
    const shopObjectId = new Types.ObjectId(SHOP_ID);

    const [categoryDocs, subCategoryDocs] = await Promise.all([
      CategoryModel.find({}).select("name _id").lean(),
      SubCategoryModel.find({}).select("name categoryId _id").lean(),
    ]);

    const categoryMap = new Map(
      categoryDocs.map((doc) => [doc.name.trim().toLowerCase(), doc._id])
    );
    const subCategoryMap = new Map<
      string,
      mongoose.Types.ObjectId
    >(
      subCategoryDocs.map((doc) => [
        `${doc.categoryId.toString()}::${doc.name.trim().toLowerCase()}`,
        doc._id,
      ])
    );

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const attributeCollector: AttributeCollector = new Map();

    for (const product of products) {
      const categoryId = categoryMap.get(
        product.categoryName.trim().toLowerCase()
      );
      if (!categoryId) {
        console.warn(
          `⚠️  Category "${product.categoryName}" not found. Skipping "${product.name}".`
        );
        skippedCount++;
        continue;
      }

      const subCategoryKey = `${categoryId.toString()}::${product.subCategoryName
        .trim()
        .toLowerCase()}`;
      const subCategoryId = subCategoryMap.get(subCategoryKey);
      if (!subCategoryId) {
        console.warn(
          `⚠️  Sub-category "${product.subCategoryName}" not found under "${product.categoryName}". Skipping "${product.name}".`
        );
        skippedCount++;
        continue;
      }

      const imageIds = product.imageObjectIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      if (imageIds.length === 0) {
        console.warn(
          `⚠️  No images mapped for "${product.name}". Skipping.`
        );
        skippedCount++;
        continue;
      }

      collectVariantAttributes(attributeCollector, categoryId, product.variants);

      const variantPayload =
        product.variants?.map((variant) => ({
          attributes: variant.attributes,
          price: Math.max(product.price + (variant.priceOffset ?? 0), 0),
          stock: variant.stock ?? Math.max(Math.round(product.stock / 4), 1),
          image: variant.imageUrl ?? "",
          sku: variant.sku,
        })) ?? [];

      const payload = {
        description: product.description,
        images: imageIds,
        categoryId,
        subCategoryId,
        price: product.price,
        discount: product.discount ?? 0,
        stock: product.stock,
        rating: product.rating ?? 4.5,
        salesCount: product.salesCount ?? 0,
        warrantyInfo: product.warrantyInfo ?? "",
        weight: product.weightKg ?? 1,
        dimensions: product.dimensions ?? "",
        metaKeywords: (product.metaKeywords || []).join(", "),
        variants: variantPayload,
        attributes: [],
        isActive: product.isActive ?? true,
      };

      const result = await ProductModel.updateOne(
        { name: product.name, shopId: shopObjectId },
        {
          $set: payload,
          $setOnInsert: {
            name: product.name,
            shopId: shopObjectId,
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount && result.upsertedCount > 0) {
        createdCount++;
        console.log(`✅ Created product: "${product.name}"`);
      } else if (result.modifiedCount && result.modifiedCount > 0) {
        updatedCount++;
        console.log(`♻️  Updated product: "${product.name}"`);
      } else {
        skippedCount++;
        console.log(`⏭️  No changes for product: "${product.name}"`);
      }
    }

    await syncCollectedVariantAttributes(attributeCollector);

    console.log("\n📊 Seed Summary (TechZone extra products):");
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ♻️  Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);

    await mongoose.disconnect();
    console.log("\n✅ Extra product seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding extra products:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedProductsExtra();


