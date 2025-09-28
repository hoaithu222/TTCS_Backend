# TTCS Backend (Express + TypeScript)

API server cho hệ thống Ecommerce, viết bằng TypeScript/Express, tích hợp Swagger, JWT, MongoDB, Cloudinary, và các tính năng thương mại điện tử cốt lõi.

## 🔧 Công nghệ chính

- TypeScript + Express
- MongoDB (Mongoose)
- JWT Authentication
- Helmet, CORS, Rate Limiting, Morgan
- Swagger/OpenAPI
- Socket.io (sẵn sàng, nếu cần)
- Cloudinary (upload ảnh)

## 📁 Cấu trúc thư mục (rút gọn)

```
src/
├── app.ts                  # Cấu hình Express app (middleware, swagger, routes)
├── server.ts               # Khởi chạy server
├── routes/                 # Mount router tập trung
├── shared/
│   ├── config/             # Cấu hình (env, swagger, db, cloudinary)
│   ├── middlewares/        # Middlewares dùng chung (auth, error, rate limit)
│   └── utils/              # Tiện ích (response util, mailer, jwt,...)
├── features/               # Từng module nghiệp vụ
│   ├── auth/               # Đăng nhập/đăng ký, quên mật khẩu, refresh token, social
│   ├── users/              # Quản lý người dùng
│   ├── category/           # Danh mục
│   ├── sub-category/       # Danh mục con
│   ├── product/            # Sản phẩm
│   ├── product-attribute/  # Thuộc tính/biến thể sản phẩm
│   ├── attribute-type/     # Loại thuộc tính
│   ├── attribute-value/    # Giá trị thuộc tính
│   ├── image/              # Media & upload Cloudinary
│   ├── shop/               # Cửa hàng
│   ├── orders/             # Đơn hàng
│   ├── cart/               # Giỏ hàng
│   ├── address/            # Địa chỉ người dùng
│   ├── reviews/            # Đánh giá
│   ├── analytics/          # Thống kê (doanh thu)
│   ├── otp/                # OTP (yêu cầu/xác thực)
│   └── health/             # Kiểm tra tình trạng server
└── models/                 # Schema Mongoose
```

## 🛠️ Cài đặt & chạy

1. Cài dependencies

```bash
npm install
```

2. Tạo file `.env` (tham khảo mẫu dưới) và khởi động lại server sau khi cập nhật:

```env
# Môi trường chạy: development | production
NODE_ENV=development

# Cổng server
PORT=5000

# Tiền tố API
API_PREFIX=/api/v1

# CORS (nguồn frontend)
CORS_ORIGIN=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Swagger base URL (tùy chọn)
SWAGGER_BASE_URL=

###########################
# Cloudinary (Upload ảnh) #
###########################
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=mylove

#############
# MongoDB   #
#############
MONGODB_URI=mongodb://localhost:27017/mylove

#############
# Redis (*) #
#############
# REDIS_URL=redis://localhost:6379

############################
# Social OAuth (tùy chọn)  #
############################
PORT_URL=http://localhost:5000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

3. Chạy ở môi trường dev

```bash
npm run dev
```

Build & chạy production

```bash
npm run build
npm start
```

## 📚 Tài liệu API

- Swagger UI: `http://localhost:5000/api-docs`

## 🔌 Các nhóm API chính

- Auth: `/auth/*` (đăng ký/đăng nhập/quên mật khẩu/refresh/logout, social)
- Users: `/users/*`
- Categories/Sub-categories: `/category`, `/sub-category`
- Products + Attributes: `/products`, `/product-attributes`, `/attribute-types`, `/attribute-values`
- Images (upload): `/images`, `/images/upload`
- Shops: `/shops/*`
- Cart: `/cart/*`
- Orders: `/orders/*`
- Addresses: `/addresses/*`
- Reviews: `/reviews/*`
- Analytics: `/analytics/*`
- OTP: `/otp/*`
- Health: `/health`

Chi tiết endpoint, request/response, type và status code đã được mô tả trong Swagger (đã cập nhật đầy đủ docs cho từng feature).

## 🛡️ Bảo mật & Middleware

- Helmet, CORS, Rate Limiting
- JWT Authentication (bearer token)
- Xử lý lỗi tập trung, trả chuẩn `ApiSuccess/ApiError`

## 🖼️ Upload ảnh (Cloudinary)

- Endpoint: `POST /images/upload` (multipart/form-data, key `file`)
- Trả về: `{ url: string }`
- Yêu cầu: Bearer token hợp lệ

## Góp ý / Hỗ trợ

Vui lòng tạo issue hoặc liên hệ nhóm phát triển khi cần hỗ trợ thêm.
