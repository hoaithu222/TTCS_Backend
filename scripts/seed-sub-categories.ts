import mongoose from "mongoose";
import dotenv from "dotenv";
import SubCategoryModel from "../src/models/SubCategoryModel";
import { mongoConfig } from "../src/shared/config/database";

dotenv.config();

type ImagePayload = {
  url: string;
  publicId: string;
};

interface SubCategorySeed {
  name: string;
  description: string;
  categoryId: string;
  isActive?: boolean;
  order_display?: number;
  image?: ImagePayload;
  image_Background?: ImagePayload;
  image_Icon?: ImagePayload;
}

const CATEGORY_IDS = {
  SMARTPHONE: "691e98b2ee081107061fd189",
  LAPTOP: "691e98e5ee081107061fd192",
  AUDIO: "691e9947ee081107061fd19b",
  TV: "691e99adee081107061fd21a",
  OFFICE: "691e9a44ee081107061fd223",
  SMARTWATCH: "691e9b6cee081107061fd2c8",
  ACCESSORY: "691e9be8ee081107061fd2d1",
  CAMERA: "691e9c21ee081107061fd2e0",
} as const;

const subCategorySeedData: SubCategorySeed[] = [
  // ========== MÁY ẢNH & CAMERA ==========
  {
    categoryId: CATEGORY_IDS.CAMERA,
    name: "Máy ảnh kỹ thuật số (DSLR, Mirrorless)",
    description:
      "Các dòng máy ảnh chuyên nghiệp cho phép thay đổi ống kính, cảm biến lớn, mang lại chất lượng hình ảnh sắc nét và nghệ thuật.",
    order_display: 0,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.CAMERA,
    name: "Camera hành trình (Action Cam)",
    description:
      "Thiết bị ghi hình nhỏ gọn, chống nước và chống rung tốt, chuyên dùng để quay lại các hoạt động thể thao, du lịch mạo hiểm.",
    order_display: 1,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.CAMERA,
    name: "Camera quan sát (IP Camera)",
    description:
      "Camera an ninh dùng cho gia đình hoặc văn phòng, hỗ trợ theo dõi từ xa qua điện thoại và đàm thoại hai chiều.",
    order_display: 2,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.CAMERA,
    name: "Flycam/Drone",
    description:
      "Thiết bị bay điều khiển từ xa có gắn camera, dùng để quay phim và chụp ảnh từ trên cao với góc nhìn toàn cảnh.",
    order_display: 3,
    isActive: true,
  },

  // ========== PHỤ KIỆN ĐIỆN TỬ ==========
  {
    categoryId: CATEGORY_IDS.ACCESSORY,
    name: "Cáp sạc & Củ sạc",
    description:
      "Phụ kiện cung cấp năng lượng cho thiết bị di động, hỗ trợ các chuẩn sạc nhanh và an toàn dòng điện.",
    order_display: 0,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.ACCESSORY,
    name: "Pin sạc dự phòng",
    description:
      "Nguồn điện di động giúp nạp năng lượng cho điện thoại, máy tính bảng khi không có ổ cắm điện gần bên.",
    order_display: 1,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.ACCESSORY,
    name: "Ốp lưng & Bao da",
    description:
      "Phụ kiện bảo vệ bên ngoài giúp thiết bị tránh trầy xước, va đập và tạo điểm nhấn thời trang.",
    order_display: 2,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.ACCESSORY,
    name: "Thẻ nhớ & USB",
    description:
      "Thiết bị lưu trữ dữ liệu di động, giúp mở rộng bộ nhớ cho máy ảnh, điện thoại hoặc sao chép dữ liệu máy tính.",
    order_display: 3,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.ACCESSORY,
    name: "Thiết bị mạng",
    description:
      "Các thiết bị như Router, Wifi Mesh giúp phát sóng và mở rộng vùng phủ sóng Internet ổn định cho không gian sử dụng.",
    order_display: 4,
    isActive: true,
  },

  // ========== ĐỒNG HỒ THÔNG MINH ==========
  {
    categoryId: CATEGORY_IDS.SMARTWATCH,
    name: "Apple Watch",
    description:
      "Đồng hồ thông minh thuộc hệ sinh thái Apple, tích hợp sâu với iPhone và các tính năng sức khỏe cao cấp.",
    order_display: 0,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.SMARTWATCH,
    name: "Đồng hồ thể thao",
    description:
      "Thiết bị chuyên dụng cho vận động viên với GPS chính xác, pin trâu và khả năng chịu môi trường khắc nghiệt.",
    order_display: 1,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.SMARTWATCH,
    name: "Vòng đeo tay thông minh (Smartband)",
    description:
      "Thiết bị nhỏ gọn tập trung vào theo dõi bước chân, giấc ngủ và nhận thông báo cơ bản với giá thành rẻ.",
    order_display: 2,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.SMARTWATCH,
    name: "Đồng hồ định vị trẻ em",
    description:
      "Đồng hồ giúp phụ huynh liên lạc và xác định vị trí của trẻ theo thời gian thực để đảm bảo an toàn.",
    order_display: 3,
    isActive: true,
  },

  // ========== THIẾT BỊ VĂN PHÒNG ==========
  {
    categoryId: CATEGORY_IDS.OFFICE,
    name: "Máy in",
    description:
      "Thiết bị chuyển đổi văn bản, hình ảnh từ máy tính ra giấy, bao gồm in laser đen trắng và in phun màu.",
    order_display: 0,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.OFFICE,
    name: "Máy chiếu",
    description:
      "Thiết bị phóng to hình ảnh từ nguồn phát lên màn chắn lớn, phục vụ thuyết trình, dạy học hoặc giải trí tại gia.",
    order_display: 1,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.OFFICE,
    name: "Máy chấm công",
    description:
      "Thiết bị ghi nhận thời gian ra/vào của nhân viên bằng vân tay, thẻ từ hoặc nhận diện khuôn mặt.",
    order_display: 2,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.OFFICE,
    name: "Máy hủy tài liệu",
    description:
      "Máy cắt nhỏ giấy tờ, văn bản quan trọng để bảo mật thông tin nội bộ, tránh rò rỉ ra bên ngoài.",
    order_display: 3,
    isActive: true,
  },

  // ========== TV - MÀN HÌNH ==========
  {
    categoryId: CATEGORY_IDS.TV,
    name: "Smart TV",
    description:
      "Tivi thông minh kết nối Internet, cài đặt được ứng dụng giải trí và điều khiển bằng giọng nói.",
    order_display: 0,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.TV,
    name: "Màn hình máy tính (Monitor)",
    description:
      "Màn hình rời kết nối với PC hoặc Laptop, được tối ưu hóa cho công việc văn phòng, đồ họa hoặc chơi game.",
    order_display: 1,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.TV,
    name: "Giá treo TV/Màn hình",
    description:
      "Phụ kiện kim loại giúp gắn tivi hoặc màn hình lên tường/bàn để tiết kiệm diện tích và tùy chỉnh góc nhìn.",
    order_display: 2,
    isActive: true,
  },

  // ========== TAI NGHE - ÂM THANH ==========
  {
    categoryId: CATEGORY_IDS.AUDIO,
    name: "Tai nghe True Wireless",
    description:
      "Tai nghe không dây hoàn toàn, nhỏ gọn, đi kèm hộp sạc tiện lợi, phù hợp cho nhu cầu di chuyển nhiều.",
    order_display: 0,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.AUDIO,
    name: "Tai nghe chụp tai (Over-ear)",
    description:
      "Tai nghe có đệm mút lớn bao trùm tai, cách âm tốt và mang lại trải nghiệm âm thanh vòm sống động.",
    order_display: 1,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.AUDIO,
    name: "Loa Bluetooth",
    description:
      "Loa di động kết nối không dây, kích thước đa dạng, dùng để nghe nhạc dã ngoại hoặc trong phòng nhỏ.",
    order_display: 2,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.AUDIO,
    name: "Loa thanh (Soundbar)",
    description:
      "Hệ thống loa dạng thanh dài thường đặt dưới TV để giả lập âm thanh rạp chiếu phim tại gia.",
    order_display: 3,
    isActive: true,
  },

  // ========== LAPTOP - MÁY TÍNH XÁCH TAY ==========
  {
    categoryId: CATEGORY_IDS.LAPTOP,
    name: "Laptop Gaming",
    description:
      "Dòng máy cấu hình mạnh mẽ, tản nhiệt lớn và card đồ họa rời chuyên dụng để chơi các tựa game nặng.",
    order_display: 0,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.LAPTOP,
    name: "Laptop Văn phòng / Sinh viên",
    description:
      "Máy tính có hiệu năng cân bằng, thiết kế bền bỉ, pin lâu và giá thành hợp lý cho nhu cầu học tập, làm việc cơ bản.",
    order_display: 1,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.LAPTOP,
    name: "Macbook",
    description:
      "Dòng laptop cao cấp của Apple chạy macOS, nổi tiếng với thiết kế sang trọng, màn hình đẹp và hiệu năng mượt mà.",
    order_display: 2,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.LAPTOP,
    name: "Laptop Mỏng nhẹ (Ultrabook)",
    description:
      "Laptop ưu tiên sự linh hoạt, trọng lượng siêu nhẹ và thiết kế thời trang dành cho doanh nhân hay người hay di chuyển.",
    order_display: 3,
    isActive: true,
  },

  // ========== ĐIỆN THOẠI - SMARTPHONE ==========
  {
    categoryId: CATEGORY_IDS.SMARTPHONE,
    name: "iPhone (iOS)",
    description:
      "Điện thoại thông minh của Apple chạy iOS, nổi bật với sự ổn định, bảo mật cao và giữ giá tốt.",
    order_display: 0,
    isActive: true,
    image_Icon: {
      publicId: "mylove/ywpxv5y2fpqx0kncdy9b",
      url: "https://res.cloudinary.com/dor0kslle/image/upload/v1763622889/mylove/ywpxv5y2fpqx0kncdy9b.jpg",
    },
  },
  {
    categoryId: CATEGORY_IDS.SMARTPHONE,
    name: "Điện thoại Samsung",
    description:
      "Smartphone Android phổ biến nhất thế giới với màn hình đẹp và camera xuất sắc.",
    order_display: 1,
    isActive: true,
    image_Icon: {
      publicId: "mylove/samsung_icon_placeholder",
      url: "https://cdn-icons-png.flaticon.com/512/5969/5969116.png",
    },
  },
  {
    categoryId: CATEGORY_IDS.SMARTPHONE,
    name: "Xiaomi",
    description: "Cấu hình mạnh mẽ trong tầm giá, pin trâu và sạc nhanh.",
    order_display: 2,
    isActive: true,
    image_Icon: {
      publicId: "mylove/xiaomi_icon_placeholder",
      url: "https://cdn-icons-png.flaticon.com/512/3291/3291651.png",
    },
  },
  {
    categoryId: CATEGORY_IDS.SMARTPHONE,
    name: "OPPO",
    description:
      "Thiết kế thời trang, camera selfie đẹp và công nghệ sạc SuperVOOC.",
    order_display: 3,
    isActive: true,
    image_Icon: {
      publicId: "mylove/oppo_icon_placeholder",
      url: "https://cdn-icons-png.flaticon.com/512/882/882735.png",
    },
  },
  {
    categoryId: CATEGORY_IDS.SMARTPHONE,
    name: "Điện thoại Android",
    description:
      "Các dòng smartphone chạy hệ điều hành Android với mẫu mã đa dạng, nhiều phân khúc giá và tính năng tùy biến cao.",
    order_display: 4,
    isActive: true,
  },
  {
    categoryId: CATEGORY_IDS.SMARTPHONE,
    name: "Điện thoại phổ thông",
    description:
      "Điện thoại bàn phím cơ bản, pin cực lâu, chủ yếu phục vụ nhu cầu nghe gọi và nhắn tin.",
    order_display: 5,
    isActive: true,
  },
];

async function seedSubCategories() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log("✅ Connected to MongoDB");

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const subCategory of subCategorySeedData) {
      if (!subCategory.categoryId) {
        console.log(
          `⚠️  Missing categoryId for sub-category "${subCategory.name}". Skipping.`
        );
        skippedCount++;
        continue;
      }

      const filter = {
        name: subCategory.name,
        categoryId: subCategory.categoryId,
      };

      const setPayload: Record<string, unknown> = {
        description: subCategory.description,
        isActive: subCategory.isActive ?? true,
        order_display: subCategory.order_display ?? 0,
      };

      if (subCategory.image) {
        setPayload.image = subCategory.image;
      }
      if (subCategory.image_Background) {
        setPayload.image_Background = subCategory.image_Background;
      }
      if (subCategory.image_Icon) {
        setPayload.image_Icon = subCategory.image_Icon;
      }

      const update = {
        $set: setPayload,
        $setOnInsert: {
          name: subCategory.name,
          categoryId: subCategory.categoryId,
        },
      };

      const result = await SubCategoryModel.updateOne(filter, update, {
        upsert: true,
        setDefaultsOnInsert: true,
      });

      if (result.upsertedCount && result.upsertedCount > 0) {
        createdCount++;
        console.log(`✅ Created sub-category: "${subCategory.name}"`);
      } else if (result.modifiedCount && result.modifiedCount > 0) {
        updatedCount++;
        console.log(`♻️  Updated sub-category: "${subCategory.name}"`);
      } else {
        skippedCount++;
        console.log(`⏭️  No changes for sub-category: "${subCategory.name}"`);
      }
    }

    console.log("\n📊 Seed Summary (SubCategories):");
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ♻️  Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);

    await mongoose.disconnect();
    console.log("\n✅ Seed sub-categories completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding sub-categories:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedSubCategories();


