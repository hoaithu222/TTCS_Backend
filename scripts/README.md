# Seed Scripts

Scripts để seed dữ liệu mẫu vào database.

## Seed Attributes

Script này sẽ tạo các Attribute Type và Attribute Value cho các danh mục sản phẩm:

- **Laptop - Máy tính xách tay**: Hãng sản xuất, CPU, RAM, ổ cứng, màn hình, card đồ họa, v.v.
- **Điện thoại - Smartphone**: Hãng sản xuất, ROM, RAM, màn hình, camera, pin, sạc, v.v.
- **TV - Màn hình**: Loại sản phẩm, kích thước, độ phân giải, tấm nền, tần số quét, v.v.
- **Tai nghe - Âm thanh**: Loại tai nghe, kết nối, tính năng đặc biệt, thời lượng pin, v.v.
- **Máy ảnh & Camera**: Loại máy, độ phân giải, kích thước cảm biến, quay phim, v.v.
- **Đồng hồ thông minh**: Hình dáng, kích thước, chất liệu dây, tính năng sức khỏe, v.v.
- **Phụ kiện điện tử**: Sạc dự phòng, cáp sạc, chuột & bàn phím, v.v.

### Cách sử dụng

```bash
npm run seed:attributes
```

Hoặc chạy trực tiếp:

```bash
ts-node scripts/seed-attributes.ts
```

### Lưu ý

- Script sẽ tự động kết nối đến MongoDB dựa trên cấu hình trong `.env` hoặc mặc định `mongodb://localhost:27017/mylove`
- Script sẽ bỏ qua các Attribute Type đã tồn tại (dựa trên tên và categoryId)
- Nếu category không tồn tại, attribute sẽ được tạo mà không có `categoryId`
- Đảm bảo đã tạo các Category trước khi chạy script để có thể gán `categoryId` chính xác

### Cấu trúc dữ liệu

Mỗi Attribute Type bao gồm:
- `name`: Tên thuộc tính
- `description`: Mô tả thuộc tính
- `categoryId`: ID của danh mục (optional)
- `isActive`: Trạng thái hoạt động (mặc định: true)
- `is_multiple`: Cho phép chọn nhiều giá trị (mặc định: false)

Mỗi Attribute Value bao gồm:
- `attributeTypeId`: ID của Attribute Type
- `value`: Giá trị của thuộc tính


