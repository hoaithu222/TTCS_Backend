import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductModel from "../src/models/ProductModal";
import ImageModel from "../src/models/ImageModel";
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
const SHOP_NAME = "TechZone Việt Nam";

type ImageSeed = {
  url: string;
  publicId: string;
};

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
  images: ImageSeed[];
  variants?: VariantSeed[];
};

const products: ProductSeed[] = [
  {
    name: "iPhone 15 Pro Max 256GB",
    description:
      "Flagship iPhone 15 Pro Max với chip A17 Pro, khung titanium, camera 48MP và cổng USB-C mới.",
    categoryName: "Điện thoại - Smartphone",
    subCategoryName: "iPhone (iOS)",
    price: 36990000,
    discount: 2000000,
    stock: 50,
    rating: 4.9,
    salesCount: 120,
    warrantyInfo: "Bảo hành chính hãng 12 tháng, 1 đổi 1 trong 30 ngày.",
    weightKg: 0.221,
    dimensions: "159.9 x 76.7 x 8.25 mm",
    metaKeywords: [
      "iphone 15 pro max",
      "smartphone ios",
      "techzone viet nam",
    ],
    images: [
      {
        publicId: "seed/products/iphone15promax",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/iphone15promax.png",
      },
    ],
    variants: [
      {
        attributes: { color: "Natural Titanium", storage: "256GB" },
        priceOffset: 0,
        stock: 20,
        sku: "IP15PM-NT-256",
      },
      {
        attributes: { color: "Blue Titanium", storage: "256GB" },
        priceOffset: 0,
        stock: 15,
        sku: "IP15PM-BT-256",
      },
    ],
  },
  {
    name: "Samsung Galaxy S24 Ultra 12GB/512GB",
    description:
      "Galaxy S24 Ultra với màn hình Dynamic AMOLED 6.8 inch, Snapdragon 8 Gen 3 và bút S Pen tích hợp.",
    categoryName: "Điện thoại - Smartphone",
    subCategoryName: "Điện thoại Samsung",
    price: 32990000,
    discount: 1500000,
    stock: 60,
    rating: 4.8,
    salesCount: 95,
    weightKg: 0.232,
    dimensions: "162.3 x 79 x 8.6 mm",
    metaKeywords: ["galaxy s24 ultra", "android flagship"],
    images: [
      {
        publicId: "seed/products/galaxys24ultra",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/galaxys24ultra.png",
      },
    ],
    variants: [
      {
        attributes: { color: "Titanium Gray", storage: "512GB" },
        sku: "S24U-TG-512",
        stock: 25,
      },
      {
        attributes: { color: "Titanium Black", storage: "512GB" },
        sku: "S24U-TB-512",
        stock: 20,
      },
    ],
  },
  {
    name: "Xiaomi 13T Pro 12GB/512GB",
    description:
      "Xiaomi 13T Pro mang tới camera Leica, sạc nhanh 120W và hiệu năng mạnh mẽ với Dimensity 9200+.",
    categoryName: "Điện thoại - Smartphone",
    subCategoryName: "Xiaomi",
    price: 18990000,
    discount: 1000000,
    stock: 75,
    rating: 4.7,
    salesCount: 130,
    weightKg: 0.206,
    dimensions: "162.2 x 75.7 x 8.5 mm",
    metaKeywords: ["xiaomi 13t pro", "leica camera"],
    images: [
      {
        publicId: "seed/products/xiaomi13tpro",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/xiaomi13tpro.png",
      },
    ],
  },
  {
    name: "OPPO Find N3 Flip 12GB/256GB",
    description:
      "OPPO Find N3 Flip với màn hình gập dọc, bản lề chắc chắn và camera Hasselblad.",
    categoryName: "Điện thoại - Smartphone",
    subCategoryName: "OPPO",
    price: 25990000,
    discount: 1800000,
    stock: 40,
    rating: 4.6,
    salesCount: 60,
    weightKg: 0.198,
    dimensions: "166.4 x 75.8 x 8.6 mm",
    metaKeywords: ["oppo find n3 flip", "foldable phone"],
    images: [
      {
        publicId: "seed/products/oppo-findn3flip",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/oppo-findn3flip.png",
      },
    ],
  },
  {
    name: "Nokia 2660 Flip 4G",
    description:
      "Điện thoại phổ thông Nokia 2660 Flip hỗ trợ 4G, pin bền và giao diện dễ dùng cho người lớn tuổi.",
    categoryName: "Điện thoại - Smartphone",
    subCategoryName: "Điện thoại phổ thông",
    price: 1690000,
    discount: 200000,
    stock: 150,
    rating: 4.5,
    salesCount: 210,
    weightKg: 0.125,
    dimensions: "108 x 55 x 18.9 mm",
    metaKeywords: ["nokia 2660 flip", "dien thoai pho thong"],
    images: [
      {
        publicId: "seed/products/nokia2660",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/nokia2660.png",
      },
    ],
  },
  {
    name: "ASUS ROG Strix G18 2024",
    description:
      "Laptop gaming ASUS ROG Strix G18 với CPU Intel Core i9-14900HX, RTX 4080 và màn hình Nebula 240Hz.",
    categoryName: "Laptop - Máy tính xách tay",
    subCategoryName: "Laptop Gaming",
    price: 72990000,
    discount: 3000000,
    stock: 25,
    rating: 4.9,
    salesCount: 35,
    weightKg: 3.1,
    dimensions: "399 x 294 x 23 mm",
    metaKeywords: ["asus rog strix g18", "laptop gaming"],
    images: [
      {
        publicId: "seed/products/rogstrixg18",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/rogstrixg18.png",
      },
    ],
    variants: [
      {
        attributes: { ram: "32GB", storage: "1TB SSD" },
        sku: "G18-32-1TB",
        stock: 10,
      },
    ],
  },
  {
    name: "Dell XPS 13 Plus 9340",
    description:
      "Dell XPS 13 Plus với thiết kế viền siêu mỏng, bàn phím cảm ứng và CPU Intel Core Ultra.",
    categoryName: "Laptop - Máy tính xách tay",
    subCategoryName: "Laptop Mỏng nhẹ (Ultrabook)",
    price: 48990000,
    discount: 2500000,
    stock: 30,
    rating: 4.7,
    salesCount: 55,
    weightKg: 1.23,
    dimensions: '295 x 199 x 15 mm',
    metaKeywords: ["dell xps 13 plus", "ultrabook"],
    images: [
      {
        publicId: "seed/products/dellxps13plus",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/dellxps13plus.png",
      },
    ],
  },
  {
    name: "MacBook Pro 14-inch M3 Pro",
    description:
      "MacBook Pro 14 inch chip M3 Pro, màn hình Liquid Retina XDR và thời lượng pin 18 giờ.",
    categoryName: "Laptop - Máy tính xách tay",
    subCategoryName: "Macbook",
    price: 54990000,
    discount: 1000000,
    stock: 35,
    rating: 4.9,
    salesCount: 80,
    weightKg: 1.61,
    dimensions: "312.6 x 221.2 x 15.5 mm",
    metaKeywords: ["macbook pro 14 m3", "apple laptop"],
    images: [
      {
        publicId: "seed/products/mbp14m3",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/mbp14m3.png",
      },
    ],
  },
  {
    name: "Lenovo ThinkPad E16 Gen 1",
    description:
      "ThinkPad E16 Gen 1 với vi xử lý AMD Ryzen 7 7730U, bàn phím ThinkPad nổi tiếng và độ bền đạt chuẩn MIL-STD.",
    categoryName: "Laptop - Máy tính xách tay",
    subCategoryName: "Laptop Văn phòng / Sinh viên",
    price: 24990000,
    discount: 1200000,
    stock: 45,
    rating: 4.6,
    salesCount: 70,
    weightKg: 1.81,
    dimensions: "356 x 247 x 20 mm",
    metaKeywords: ["thinkpad e16", "laptop van phong"],
    images: [
      {
        publicId: "seed/products/thinkpade16",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/thinkpade16.png",
      },
    ],
  },
  {
    name: "Sony WH-1000XM5",
    description:
      "Tai nghe chụp tai Sony WH-1000XM5 với khả năng chống ồn chủ động, pin 30 giờ và âm thanh Hi-Res.",
    categoryName: "Tai nghe - Âm thanh",
    subCategoryName: "Tai nghe chụp tai (Over-ear)",
    price: 8990000,
    discount: 900000,
    stock: 80,
    rating: 4.9,
    salesCount: 150,
    weightKg: 0.25,
    dimensions: "Case 189 x 189 x 68 mm",
    metaKeywords: ["sony wh1000xm5", "anc headphone"],
    images: [
      {
        publicId: "seed/products/sonywh1000xm5",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/sonywh1000xm5.png",
      },
    ],
  },
  {
    name: "Apple AirPods Pro 2 USB-C",
    description:
      "AirPods Pro 2 với chip H2, Adaptive Audio và hộp sạc USB-C hỗ trợ Find My.",
    categoryName: "Tai nghe - Âm thanh",
    subCategoryName: "Tai nghe True Wireless",
    price: 6490000,
    discount: 500000,
    stock: 120,
    rating: 4.8,
    salesCount: 220,
    weightKg: 0.06,
    dimensions: "Hộp sạc 45.2 x 60.6 x 21.7 mm",
    metaKeywords: ["airpods pro 2", "true wireless"],
    images: [
      {
        publicId: "seed/products/airpodspro2",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/airpodspro2.png",
      },
    ],
  },
  {
    name: "JBL Charge 6 Portable Speaker",
    description:
      "Loa Bluetooth JBL Charge 6 với âm thanh JBL Original Pro, pin 20 giờ và chuẩn chống nước IP67.",
    categoryName: "Tai nghe - Âm thanh",
    subCategoryName: "Loa Bluetooth",
    price: 4990000,
    discount: 600000,
    stock: 85,
    rating: 4.7,
    salesCount: 90,
    weightKg: 0.96,
    dimensions: "223 x 96.5 x 94 mm",
    metaKeywords: ["jbl charge 6", "portable speaker"],
    images: [
      {
        publicId: "seed/products/jblcharge6",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/jblcharge6.png",
      },
    ],
  },
  {
    name: "Samsung HW-Q990D Soundbar",
    description:
      "Soundbar Samsung HW-Q990D 11.1.4 kênh với Dolby Atmos không dây và Q-Symphony cho trải nghiệm rạp chiếu phim.",
    categoryName: "Tai nghe - Âm thanh",
    subCategoryName: "Loa thanh (Soundbar)",
    price: 32990000,
    discount: 2500000,
    stock: 25,
    rating: 4.8,
    salesCount: 40,
    weightKg: 7.7,
    dimensions: "1232 x 69.5 x 138 mm",
    metaKeywords: ["samsung hw q990d", "dolby atmos soundbar"],
    images: [
      {
        publicId: "seed/products/samsungq990d",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/samsungq990d.png",
      },
    ],
  },
  {
    name: "LG C4 65-inch OLED evo Smart TV",
    description:
      "Smart TV LG OLED C4 65 inch với chip Alpha 9 Gen 7, độ sáng cao hơn và hỗ trợ Dolby Vision Gaming.",
    categoryName: "TV - Màn hình",
    subCategoryName: "Smart TV",
    price: 58990000,
    discount: 4000000,
    stock: 20,
    rating: 4.9,
    salesCount: 30,
    weightKg: 24,
    dimensions: "1449 x 830 x 45.1 mm",
    metaKeywords: ["lg c4 oled", "smart tv"],
    images: [
      {
        publicId: "seed/products/lgc4oled",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/lgc4oled.png",
      },
    ],
  },
  {
    name: "Gigabyte M27Q Monitor 170Hz",
    description:
      "Màn hình Gigabyte M27Q 27 inch, độ phân giải 2K, tần số quét 170Hz và hỗ trợ KVM Switch.",
    categoryName: "TV - Màn hình",
    subCategoryName: "Màn hình máy tính (Monitor)",
    price: 7990000,
    discount: 900000,
    stock: 70,
    rating: 4.7,
    salesCount: 110,
    weightKg: 6.5,
    dimensions: "615 x 518 x 193 mm",
    metaKeywords: ["gigabyte m27q", "gaming monitor"],
    images: [
      {
        publicId: "seed/products/gigabytem27q",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/gigabytem27q.png",
      },
    ],
  },
  {
    name: "North Bayou F120 Gas Spring Arm",
    description:
      "Giá treo màn hình North Bayou F120 hỗ trợ 17-30 inch, xoay đa hướng với lò xo trợ lực.",
    categoryName: "TV - Màn hình",
    subCategoryName: "Giá treo TV/Màn hình",
    price: 1590000,
    discount: 200000,
    stock: 90,
    rating: 4.6,
    salesCount: 140,
    weightKg: 2.3,
    dimensions: "Support VESA 75x75 - 100x100",
    metaKeywords: ["north bayou f120", "gia treo man hinh"],
    images: [
      {
        publicId: "seed/products/nbf120",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/nbf120.png",
      },
    ],
  },
  {
    name: "Canon EOS R8 Full-frame",
    description:
      "Máy ảnh Canon EOS R8 cảm biến full-frame 24.2MP, quay 4K60 và Dual Pixel AF II.",
    categoryName: "Máy ảnh & Camera",
    subCategoryName: "Máy ảnh kỹ thuật số (DSLR, Mirrorless)",
    price: 38990000,
    discount: 1500000,
    stock: 35,
    rating: 4.8,
    salesCount: 45,
    weightKg: 0.461,
    dimensions: "132.5 x 86.1 x 70 mm",
    metaKeywords: ["canon eos r8", "mirrorless"],
    images: [
      {
        publicId: "seed/products/canonr8",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/canonr8.png",
      },
    ],
  },
  {
    name: "GoPro HERO12 Black",
    description:
      "Action Cam GoPro HERO12 Black quay 5.3K60, chống nước 10m không cần vỏ và hỗ trợ GP-Log.",
    categoryName: "Máy ảnh & Camera",
    subCategoryName: "Camera hành trình (Action Cam)",
    price: 13990000,
    discount: 800000,
    stock: 80,
    rating: 4.7,
    salesCount: 160,
    weightKg: 0.154,
    dimensions: "50.8 x 71.8 x 33.6 mm",
    metaKeywords: ["gopro hero12", "action cam"],
    images: [
      {
        publicId: "seed/products/goprohero12",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/goprohero12.png",
      },
    ],
  },
  {
    name: "Dahua IPC-HFW2231T-AS-S2",
    description:
      "Camera IP Dahua 2MP FullColor với đèn trợ sáng, micro tích hợp và hỗ trợ chuẩn IP67.",
    categoryName: "Máy ảnh & Camera",
    subCategoryName: "Camera quan sát (IP Camera)",
    price: 2590000,
    discount: 300000,
    stock: 120,
    rating: 4.5,
    salesCount: 180,
    weightKg: 0.45,
    dimensions: "244.1 x 79 x 75.9 mm",
    metaKeywords: ["dahua ipc hfw2231", "ip camera"],
    images: [
      {
        publicId: "seed/products/dahuaipc2231",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/dahuaipc2231.png",
      },
    ],
  },
  {
    name: "DJI Air 3 Fly More Combo",
    description:
      "Flycam DJI Air 3 với hệ thống camera kép 24mm & 70mm, thời gian bay 46 phút và truyền hình ảnh O4.",
    categoryName: "Máy ảnh & Camera",
    subCategoryName: "Flycam/Drone",
    price: 38990000,
    discount: 2000000,
    stock: 28,
    rating: 4.8,
    salesCount: 55,
    weightKg: 0.72,
    dimensions: "207 x 100.5 x 91.1 mm (gập)",
    metaKeywords: ["dji air 3", "flycam"],
    images: [
      {
        publicId: "seed/products/djiair3",
        url: "https://res.cloudinary.com/demo/image/upload/v1732080000/djiair3.png",
      },
    ],
  },
];

async function ensureImage(image: ImageSeed) {
  const doc = await ImageModel.findOneAndUpdate(
    { publicId: image.publicId },
    { $set: image },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc._id;
}

async function seedProducts() {
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

      const imageIds: mongoose.Types.ObjectId[] = [];
      for (const img of product.images) {
        const imageId = await ensureImage(img);
        imageIds.push(imageId as mongoose.Types.ObjectId);
      }

      if (imageIds.length === 0) {
        console.warn(
          `⚠️  No images prepared for "${product.name}". Skipping.`
        );
        skippedCount++;
        continue;
      }

      collectVariantAttributes(attributeCollector, categoryId, product.variants);

      const variantPayload =
        product.variants?.map((variant, index) => ({
          attributes: variant.attributes,
          price: Math.max(product.price + (variant.priceOffset ?? 0), 0),
          stock: variant.stock ?? Math.max(Math.round(product.stock / 4), 1),
          image: variant.imageUrl ?? product.images[0]?.url ?? "",
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
        warrantyInfo:
          product.warrantyInfo || "Bảo hành chính hãng 12 tháng tại TechZone.",
        weight: product.weightKg ?? 1,
        dimensions: product.dimensions ?? "",
        metaKeywords: (product.metaKeywords || []).join(", "),
        variants: variantPayload,
        attributes: [],
        isActive: true,
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

    console.log("\n📊 Seed Summary (Products - TechZone):");
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ♻️  Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);

    await mongoose.disconnect();
    console.log("\n✅ Seed products completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedProducts();


