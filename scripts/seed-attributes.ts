import mongoose from "mongoose";
import dotenv from "dotenv";
import AttributeTypeModel from "../src/models/AttributeType";
import AttributeValueModel from "../src/models/AttributeValue";
import CategoryModel from "../src/models/CategoryModel";
import { mongoConfig } from "../src/shared/config/database";

// Load environment variables
dotenv.config();

type AttributeConfig = {
  name: string;
  description?: string;
  categoryName?: string;
  categoryId?: string;
  is_multiple?: boolean;
  values?: string[];
};

const CATEGORY_NAME_TO_ID: Record<string, string> = {
  "Điện thoại - Smartphone": "691e98b2ee081107061fd189",
  "Laptop - Máy tính xách tay": "691e98e5ee081107061fd192",
  "Tai nghe - Âm thanh": "691e9947ee081107061fd19b",
  "TV - Màn hình": "691e99adee081107061fd21a",
  "Thiết bị văn phòng": "691e9a44ee081107061fd223",
  "Đồng hồ thông minh - Smartwatch": "691e9b6cee081107061fd2c8",
  "Đồng hồ thông minh": "691e9b6cee081107061fd2c8",
  "Phụ kiện điện tử": "691e9be8ee081107061fd2d1",
  "Máy ảnh & Camera": "691e9c21ee081107061fd2e0",
};

// Attribute configuration data
const attributeConfig: AttributeConfig[] = [
  // ========== LAPTOP - MÁY TÍNH XÁCH TAY ==========
  {
    name: "Hãng sản xuất",
    description: "Thương hiệu laptop",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: [
      "Dell",
      "HP",
      "Asus",
      "Acer",
      "MSI",
      "Lenovo",
      "Apple",
      "LG",
      "Samsung",
      "Huawei",
      "Xiaomi",
    ],
  },
  {
    name: "Loại CPU",
    description: "Loại bộ vi xử lý",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: [
      "Intel Core i3",
      "Intel Core i5",
      "Intel Core i7",
      "Intel Core i9",
      "AMD Ryzen 3",
      "AMD Ryzen 5",
      "AMD Ryzen 7",
      "AMD Ryzen 9",
      "Apple M1",
      "Apple M2",
      "Apple M3",
    ],
  },
  {
    name: "Thế hệ CPU",
    description: "Thế hệ của bộ vi xử lý",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: [
      "Gen 12",
      "Gen 13",
      "Gen 14",
      "Series 5000",
      "Series 7000",
      "Series 8000",
    ],
  },
  {
    name: "Dung lượng RAM",
    description: "Dung lượng bộ nhớ RAM",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: ["8GB", "16GB", "32GB", "64GB"],
  },
  {
    name: "Loại RAM",
    description: "Loại bộ nhớ RAM",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: ["DDR4", "DDR5", "LPDDR5 (Onboard)"],
  },
  {
    name: "Loại ổ cứng",
    description: "Loại ổ lưu trữ",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: ["SSD", "HDD", "SSD + HDD"],
  },
  {
    name: "Dung lượng ổ cứng",
    description: "Dung lượng lưu trữ",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: ["256GB", "512GB", "1TB", "2TB", "4TB"],
  },
  {
    name: "Kích thước màn hình",
    description: "Kích thước màn hình laptop",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: ['13.3"', '14"', '15.6"', '16"', '17.3"'],
  },
  {
    name: "Độ phân giải màn hình",
    description: "Độ phân giải hiển thị",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: ["Full HD", "2K", "4K", "Retina"],
  },
  {
    name: "Tần số quét màn hình",
    description: "Tần số làm mới màn hình",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: ["60Hz", "120Hz", "144Hz", "165Hz", "240Hz"],
  },
  {
    name: "Card đồ họa",
    description: "Loại card đồ họa",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: false,
    values: [
      "NVIDIA RTX",
      "NVIDIA GTX",
      "AMD Radeon",
      "Intel Iris Xe",
      "AMD Radeon Graphics",
      "Card tích hợp",
    ],
  },
  {
    name: "Nhu cầu sử dụng",
    description: "Mục đích sử dụng laptop",
    categoryName: "Laptop - Máy tính xách tay",
    is_multiple: true,
    values: ["Gaming", "Văn phòng", "Đồ họa kỹ thuật", "Mỏng nhẹ cao cấp"],
  },

  // ========== ĐIỆN THOẠI - SMARTPHONE ==========
  {
    name: "Hãng sản xuất",
    description: "Thương hiệu điện thoại",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: false,
    values: [
      "Apple",
      "Samsung",
      "Xiaomi",
      "OPPO",
      "Vivo",
      "Realme",
      "OnePlus",
      "Huawei",
      "Nokia",
      "Motorola",
    ],
  },
  {
    name: "Bộ nhớ trong (ROM)",
    description: "Dung lượng lưu trữ",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: false,
    values: ["64GB", "128GB", "256GB", "512GB", "1TB"],
  },
  {
    name: "Dung lượng RAM",
    description: "Bộ nhớ RAM",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: false,
    values: ["4GB", "6GB", "8GB", "12GB", "16GB"],
  },
  {
    name: "Kích thước màn hình",
    description: "Kích thước màn hình (inch)",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: false,
    values: ['5.5"', '6.0"', '6.1"', '6.2"', '6.4"', '6.5"', '6.7"', '6.9"'],
  },
  {
    name: "Công nghệ màn hình",
    description: "Loại tấm nền màn hình",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: false,
    values: [
      "IPS LCD",
      "AMOLED",
      "Dynamic AMOLED",
      "Super Retina XDR",
      "OLED",
      "LCD",
    ],
  },
  {
    name: "Độ phân giải camera sau",
    description: "Megapixel camera chính",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: false,
    values: [
      "12MP",
      "48MP",
      "50MP",
      "64MP",
      "108MP",
      "200MP",
    ],
  },
  {
    name: "Tính năng camera",
    description: "Các tính năng camera",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: true,
    values: [
      "Góc rộng",
      "Zoom quang học",
      "Chống rung OIS",
      "Quay 4K",
      "Quay 8K",
      "Chế độ chụp đêm",
    ],
  },
  {
    name: "Dung lượng pin",
    description: "Dung lượng pin (mAh)",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: false,
    values: [
      "Dưới 4000mAh",
      "4000 - 5000mAh",
      "Trên 5000mAh",
    ],
  },
  {
    name: "Công suất sạc nhanh",
    description: "Công suất sạc nhanh (W)",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: false,
    values: ["20W", "33W", "67W", "120W", "150W", "200W"],
  },
  {
    name: "Kết nối mạng",
    description: "Hỗ trợ mạng di động",
    categoryName: "Điện thoại - Smartphone",
    is_multiple: false,
    values: ["4G", "5G"],
  },

  // ========== TV - MÀN HÌNH (MONITOR) ==========
  {
    name: "Loại sản phẩm",
    description: "Phân loại TV hoặc Monitor",
    categoryName: "TV - Màn hình",
    is_multiple: false,
    values: ["TV", "Màn hình máy tính"],
  },
  {
    name: "Kích thước",
    description: "Kích thước màn hình",
    categoryName: "TV - Màn hình",
    is_multiple: false,
    values: [
      '24"',
      '27"',
      '32"',
      '43"',
      '50"',
      '55"',
      '65"',
      '75"',
      "Trên 75\"",
    ],
  },
  {
    name: "Độ phân giải",
    description: "Độ phân giải hiển thị",
    categoryName: "TV - Màn hình",
    is_multiple: false,
    values: ["Full HD", "2K (QHD)", "4K (UHD)", "8K"],
  },
  {
    name: "Tấm nền (Panel)",
    description: "Loại tấm nền màn hình",
    categoryName: "TV - Màn hình",
    is_multiple: false,
    values: ["IPS", "VA", "TN", "OLED", "QLED", "Mini-LED"],
  },
  {
    name: "Tần số quét",
    description: "Tần số làm mới (cho Monitor)",
    categoryName: "TV - Màn hình",
    is_multiple: false,
    values: ["60Hz", "75Hz", "100Hz", "144Hz", "165Hz", "240Hz"],
  },
  {
    name: "Kiểu màn hình",
    description: "Hình dáng màn hình",
    categoryName: "TV - Màn hình",
    is_multiple: false,
    values: ["Màn hình phẳng", "Màn hình cong"],
  },
  {
    name: "Cổng kết nối",
    description: "Các cổng kết nối hỗ trợ",
    categoryName: "TV - Màn hình",
    is_multiple: true,
    values: ["HDMI", "DisplayPort", "USB-C", "VGA", "DVI"],
  },
  {
    name: "Tiện ích TV",
    description: "Các tính năng đặc biệt của TV",
    categoryName: "TV - Màn hình",
    is_multiple: true,
    values: [
      "Tìm kiếm giọng nói",
      "Chiếu màn hình điện thoại",
      "Chơi game (Game mode)",
      "Smart TV",
      "HDR",
    ],
  },

  // ========== TAI NGHE - ÂM THANH ==========
  {
    name: "Loại tai nghe",
    description: "Kiểu dáng tai nghe",
    categoryName: "Tai nghe - Âm thanh",
    is_multiple: false,
    values: [
      "In-ear (nhét tai)",
      "Earbuds",
      "Over-ear (chụp tai)",
      "On-ear",
    ],
  },
  {
    name: "Kết nối",
    description: "Phương thức kết nối",
    categoryName: "Tai nghe - Âm thanh",
    is_multiple: false,
    values: [
      "Có dây (3.5mm)",
      "Có dây (USB)",
      "Không dây (Bluetooth)",
    ],
  },
  {
    name: "Tính năng đặc biệt",
    description: "Các tính năng nổi bật",
    categoryName: "Tai nghe - Âm thanh",
    is_multiple: true,
    values: [
      "Chống ồn chủ động (ANC)",
      "Xuyên âm (Transparency Mode)",
      "Kháng nước (IPX4)",
      "Kháng nước (IPX5)",
      "Kháng nước (IPX7)",
      "Micro đàm thoại",
    ],
  },
  {
    name: "Thời lượng pin",
    description: "Thời gian sử dụng pin",
    categoryName: "Tai nghe - Âm thanh",
    is_multiple: false,
    values: ["Dưới 8 giờ", "8-20 giờ", "Trên 20 giờ"],
  },
  {
    name: "Công suất loa",
    description: "Công suất loa Bluetooth/Soundbar",
    categoryName: "Tai nghe - Âm thanh",
    is_multiple: false,
    values: ["Dưới 20W", "20W - 50W", "Trên 50W"],
  },

  // ========== MÁY ẢNH & CAMERA ==========
  {
    name: "Loại máy",
    description: "Phân loại máy ảnh",
    categoryName: "Máy ảnh & Camera",
    is_multiple: false,
    values: ["DSLR", "Mirrorless", "Compact", "Action Cam"],
  },
  {
    name: "Độ phân giải cảm biến",
    description: "Megapixel cảm biến",
    categoryName: "Máy ảnh & Camera",
    is_multiple: false,
    values: [
      "12MP - 20MP",
      "20MP - 30MP",
      "Trên 30MP",
    ],
  },
  {
    name: "Kích thước cảm biến",
    description: "Kích cỡ cảm biến hình ảnh",
    categoryName: "Máy ảnh & Camera",
    is_multiple: false,
    values: [
      "Full-frame",
      "APS-C",
      "Micro Four Thirds",
      "1 inch",
    ],
  },
  {
    name: "Quay phim",
    description: "Độ phân giải quay video",
    categoryName: "Máy ảnh & Camera",
    is_multiple: false,
    values: ["HD", "Full HD", "4K", "8K"],
  },
  {
    name: "Kết nối",
    description: "Các phương thức kết nối",
    categoryName: "Máy ảnh & Camera",
    is_multiple: true,
    values: ["Wifi", "Bluetooth", "NFC", "GPS"],
  },
  {
    name: "ISO tối đa",
    description: "Độ nhạy sáng tối đa",
    categoryName: "Máy ảnh & Camera",
    is_multiple: false,
    values: ["6400", "12800", "25600", "51200+"],
  },

  // ========== ĐỒNG HỒ THÔNG MINH (SMARTWATCH) ==========
  {
    name: "Hình dáng mặt",
    description: "Kiểu dáng mặt đồng hồ",
    categoryName: "Đồng hồ thông minh",
    is_multiple: false,
    values: ["Tròn", "Vuông", "Chữ nhật"],
  },
  {
    name: "Kích thước mặt",
    description: "Kích thước mặt đồng hồ",
    categoryName: "Đồng hồ thông minh",
    is_multiple: false,
    values: ["< 40mm", "40-44mm", "> 44mm"],
  },
  {
    name: "Chất liệu dây",
    description: "Vật liệu dây đeo",
    categoryName: "Đồng hồ thông minh",
    is_multiple: false,
    values: ["Silicone", "Da", "Kim loại", "Vải"],
  },
  {
    name: "Tiện ích sức khỏe",
    description: "Tính năng theo dõi sức khỏe",
    categoryName: "Đồng hồ thông minh",
    is_multiple: true,
    values: [
      "Đo nhịp tim",
      "Đo nồng độ oxy (SpO2)",
      "Theo dõi giấc ngủ",
      "Đếm bước chân",
      "Điện tâm đồ (ECG)",
    ],
  },
  {
    name: "Tính năng thông minh",
    description: "Các tính năng thông minh",
    categoryName: "Đồng hồ thông minh",
    is_multiple: true,
    values: [
      "Nghe gọi trên đồng hồ",
      "Nhận thông báo",
      "Phát nhạc",
      "GPS độc lập",
      "eSIM",
    ],
  },
  {
    name: "Thời lượng pin",
    description: "Thời gian sử dụng pin",
    categoryName: "Đồng hồ thông minh",
    is_multiple: false,
    values: ["< 2 ngày", "2 - 7 ngày", "> 7 ngày"],
  },

  // ========== PHỤ KIỆN ĐIỆN TỬ ==========
  {
    name: "Dung lượng sạc dự phòng",
    description: "Dung lượng pin sạc dự phòng",
    categoryName: "Phụ kiện điện tử",
    is_multiple: false,
    values: ["10.000mAh", "20.000mAh", "30.000mAh"],
  },
  {
    name: "Lõi pin sạc dự phòng",
    description: "Loại pin sạc dự phòng",
    categoryName: "Phụ kiện điện tử",
    is_multiple: false,
    values: ["Polymer", "Li-ion"],
  },
  {
    name: "Công suất sạc",
    description: "Công suất sạc nhanh",
    categoryName: "Phụ kiện điện tử",
    is_multiple: false,
    values: ["Sạc thường", "Sạc nhanh (PD)", "Sạc nhanh (QC)"],
  },
  {
    name: "Đầu vào cáp sạc",
    description: "Cổng đầu vào cáp sạc",
    categoryName: "Phụ kiện điện tử",
    is_multiple: false,
    values: ["USB-A", "USB-C"],
  },
  {
    name: "Đầu ra cáp sạc",
    description: "Cổng đầu ra cáp sạc",
    categoryName: "Phụ kiện điện tử",
    is_multiple: false,
    values: ["Lightning", "USB-C", "Micro USB"],
  },
  {
    name: "Độ dài cáp sạc",
    description: "Chiều dài cáp sạc",
    categoryName: "Phụ kiện điện tử",
    is_multiple: false,
    values: ["1m", "2m", "3m"],
  },
  {
    name: "Loại kết nối chuột/bàn phím",
    description: "Phương thức kết nối",
    categoryName: "Phụ kiện điện tử",
    is_multiple: false,
    values: [
      "Có dây",
      "Bluetooth",
      "Wireless 2.4Ghz",
    ],
  },
  {
    name: "Loại bàn phím",
    description: "Kiểu bàn phím",
    categoryName: "Phụ kiện điện tử",
    is_multiple: false,
    values: [
      "Cơ (Blue switch)",
      "Cơ (Red switch)",
      "Cơ (Brown switch)",
      "Giả cơ",
      "Thường",
    ],
  },
  {
    name: "DPI chuột",
    description: "Độ phân giải chuột",
    categoryName: "Phụ kiện điện tử",
    is_multiple: false,
    values: ["< 1000", "1000-2000", "> 2000"],
  },
];

// Main seed function
async function seedAttributes() {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log("✅ Connected to MongoDB");

    // Get all categories to map category names to IDs
    const categories = await CategoryModel.find({});
    const categoryMap = new Map(
      categories.map((cat) => [cat.name, cat._id.toString()])
    );

    let createdCount = 0;
    let skippedCount = 0;
    let valueCount = 0;

    // Process each attribute configuration
    for (const attrConfig of attributeConfig) {
      // Resolve category ID priority: explicit ID -> static map -> database lookup
      let categoryId: string | undefined = attrConfig.categoryId;
      if (!categoryId && attrConfig.categoryName) {
        categoryId = CATEGORY_NAME_TO_ID[attrConfig.categoryName];
      }

      if (!categoryId && attrConfig.categoryName) {
        categoryId = categoryMap.get(attrConfig.categoryName);
        if (!categoryId) {
          console.log(
            `⚠️  Category "${attrConfig.categoryName}" not found. Creating attribute without categoryId.`
          );
        }
      }

      // Check if attribute type already exists
      const existingAttr = await AttributeTypeModel.findOne({
        name: attrConfig.name,
        ...(categoryId && { categoryId }),
      });

      if (existingAttr) {
        console.log(
          `⏭️  Skipping "${attrConfig.name}" - already exists`
        );
        skippedCount++;
        continue;
      }

      // Create attribute type
      const attributeType = await AttributeTypeModel.create({
        name: attrConfig.name,
        description: attrConfig.description,
        categoryId: categoryId || undefined,
        isActive: true,
        is_multiple: attrConfig.is_multiple || false,
      });

      console.log(`✅ Created attribute type: "${attrConfig.name}"`);

      // Create attribute values
      if (attrConfig.values && attrConfig.values.length > 0) {
        const valueDocs = attrConfig.values.map((value) => ({
          attributeTypeId: attributeType._id,
          value: value,
        }));

        await AttributeValueModel.insertMany(valueDocs);
        valueCount += valueDocs.length;
        console.log(
          `   └─ Created ${valueDocs.length} values for "${attrConfig.name}"`
        );
      }

      createdCount++;
    }

    console.log("\n📊 Seed Summary:");
    console.log(`   ✅ Created: ${createdCount} attribute types`);
    console.log(`   ⏭️  Skipped: ${skippedCount} attribute types`);
    console.log(`   📝 Created: ${valueCount} attribute values`);

    // Close connection
    await mongoose.disconnect();
    console.log("\n✅ Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding attributes:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run seed
seedAttributes();

