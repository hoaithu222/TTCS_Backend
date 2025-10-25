🌐 Tổng quan API

Tiền tố API (mặc định): /api/v1
Giao diện Swagger UI: GET /api-docs — Trang tài liệu tương tác để test API trực tiếp.

🩺 Hệ thống (System)

GET / — Kiểm tra phản hồi máy chủ (trả về "Hello world")

GET /api/v1/health — Kiểm tra trạng thái hoạt động của hệ thống

🔐 Xác thực (Auth)

POST /api/v1/auth/register — Đăng ký tài khoản mới

GET /api/v1/auth/verify-email — Xác minh email qua token

POST /api/v1/auth/resend-verify-email — Gửi lại email xác minh

POST /api/v1/auth/login — Đăng nhập bằng email và mật khẩu

POST /api/v1/auth/forgot-password — Yêu cầu đặt lại mật khẩu qua email

POST /api/v1/auth/reset-password — Đặt lại mật khẩu bằng token hoặc OTP

POST /api/v1/auth/refresh-token — Cấp mới access token

POST /api/v1/auth/logout — Đăng xuất khỏi phiên hiện tại

GET /api/v1/auth/profile — Lấy thông tin hồ sơ người dùng hiện tại (cần đăng nhập)

🌐 Đăng nhập mạng xã hội (Social Auth)

GET /api/v1/auth/social/google — Chuyển hướng đến đăng nhập Google

GET /api/v1/auth/social/google/callback — Nhận token sau khi đăng nhập Google

GET /api/v1/auth/social/facebook — Chuyển hướng đến đăng nhập Facebook

GET /api/v1/auth/social/facebook/callback — Nhận token sau khi đăng nhập Facebook

GET /api/v1/auth/social/github — Chuyển hướng đến đăng nhập GitHub

GET /api/v1/auth/social/github/callback — Nhận token sau khi đăng nhập GitHub

🔢 OTP (Mã xác thực một lần)

POST /api/v1/otp/request — Yêu cầu cấp mã OTP (qua email/số điện thoại)

POST /api/v1/otp/verify — Xác minh mã OTP

👤 Người dùng (Users)

⚠️ Ghi chú: Các route hiện tại có phần trùng lặp /users/users do cấu trúc mount router.

GET /api/v1/users/users — Lấy danh sách người dùng

GET /api/v1/users/users/:id — Lấy thông tin người dùng theo ID

PUT /api/v1/users/users/:id — Cập nhật người dùng (ghi đè)

PATCH /api/v1/users/users/update/:id — Cập nhật người dùng (một phần)

DELETE /api/v1/users/users/:id — Xóa người dùng theo ID

📂 Danh mục (Categories)

GET /api/v1/category/ — Lấy danh sách danh mục

GET /api/v1/category/:id — Chi tiết danh mục

GET /api/v1/category/:id/sub-categories — Lấy danh sách danh mục con

POST /api/v1/category/ — Tạo danh mục mới (chỉ admin)

PUT /api/v1/category/:id — Cập nhật danh mục (chỉ admin)

DELETE /api/v1/category/:id — Xóa danh mục (chỉ admin)

🪜 Danh mục con (Sub Categories)

GET /api/v1/sub-category/ — Lấy danh sách danh mục con (có thể lọc)

GET /api/v1/sub-category/:id — Chi tiết danh mục con

POST /api/v1/sub-category/ — Tạo danh mục con (chỉ admin)

PUT /api/v1/sub-category/:id — Cập nhật danh mục con (chỉ admin)

DELETE /api/v1/sub-category/:id — Xóa danh mục con (chỉ admin)

🛍️ Sản phẩm (Products)

GET /api/v1/products/ — Lấy danh sách sản phẩm (có phân trang và lọc)

GET /api/v1/products/:id — Chi tiết sản phẩm

POST /api/v1/products/ — Tạo sản phẩm mới (admin hoặc chủ shop)

PUT /api/v1/products/:id — Cập nhật sản phẩm (admin hoặc chủ shop)

DELETE /api/v1/products/:id — Xóa sản phẩm (admin hoặc chủ shop)

📊 Thuộc tính sản phẩm (Product Attributes)

GET /api/v1/product-attributes/ — Lấy danh sách thuộc tính (biến thể)

GET /api/v1/product-attributes/:id — Chi tiết thuộc tính sản phẩm

POST /api/v1/product-attributes/ — Tạo thuộc tính sản phẩm (admin hoặc chủ shop)

PUT /api/v1/product-attributes/:id — Cập nhật thuộc tính sản phẩm

DELETE /api/v1/product-attributes/:id — Xóa thuộc tính sản phẩm

🏷️ Kiểu thuộc tính (Attribute Types)

GET /api/v1/attribute-types/ — Lấy danh sách kiểu thuộc tính

GET /api/v1/attribute-types/:id — Chi tiết kiểu thuộc tính

POST /api/v1/attribute-types/ — Tạo kiểu thuộc tính (admin)

PUT /api/v1/attribute-types/:id — Cập nhật kiểu thuộc tính

DELETE /api/v1/attribute-types/:id — Xóa kiểu thuộc tính

🔣 Giá trị thuộc tính (Attribute Values)

GET /api/v1/attribute-values/ — Lấy danh sách giá trị thuộc tính (có lọc)

GET /api/v1/attribute-values/:id — Chi tiết giá trị thuộc tính

POST /api/v1/attribute-values/ — Tạo giá trị thuộc tính (admin)

PUT /api/v1/attribute-values/:id — Cập nhật giá trị thuộc tính

DELETE /api/v1/attribute-values/:id — Xóa giá trị thuộc tính

🖼️ Hình ảnh (Images)

GET /api/v1/images/ — Lấy danh sách hình ảnh

GET /api/v1/images/:id — Chi tiết hình ảnh

POST /api/v1/images/ — Tạo hình ảnh (admin)

POST /api/v1/images/upload — Upload hình ảnh (multipart form-data)

PUT /api/v1/images/:id — Cập nhật hình ảnh

DELETE /api/v1/images/:id — Xóa hình ảnh

🏪 Cửa hàng (Shops)

GET /api/v1/shops/ — Lấy danh sách cửa hàng

GET /api/v1/shops/:id — Chi tiết cửa hàng

POST /api/v1/shops/ — Tạo cửa hàng mới (admin hoặc người dùng)

PUT /api/v1/shops/:id — Cập nhật cửa hàng (admin hoặc chủ shop)

DELETE /api/v1/shops/:id — Xóa cửa hàng (admin)

POST /api/v1/shops/:id/follow — Theo dõi cửa hàng (cần đăng nhập)

DELETE /api/v1/shops/:id/follow — Bỏ theo dõi cửa hàng

GET /api/v1/shops/:id/following — Kiểm tra người dùng hiện tại có đang theo dõi không

GET /api/v1/shops/:id/followers/count — Số lượng người theo dõi cửa hàng

📈 Phân tích (Analytics)

GET /api/v1/analytics/admin/revenue — Thống kê doanh thu tổng (admin)

GET /api/v1/analytics/shops/:shopId/revenue — Thống kê doanh thu theo cửa hàng

GET /api/v1/analytics/timeseries/revenue — Chuỗi thời gian doanh thu

GET /api/v1/analytics/top/products — Sản phẩm bán chạy nhất

GET /api/v1/analytics/shops/:shopId/top-products — Sản phẩm bán chạy của cửa hàng

GET /api/v1/analytics/top/shops — Cửa hàng có doanh thu cao nhất

GET /api/v1/analytics/orders/status-distribution — Phân bố trạng thái đơn hàng

GET /api/v1/analytics/orders/aov — Giá trị trung bình mỗi đơn hàng

📦 Đơn hàng (Orders)

GET /api/v1/orders/ — Lấy danh sách đơn hàng (admin: tất cả, user: của mình)

GET /api/v1/orders/:id — Chi tiết đơn hàng

POST /api/v1/orders/ — Tạo đơn hàng (cần đăng nhập)

PUT /api/v1/orders/:id — Cập nhật đơn hàng (admin)

PUT /api/v1/orders/:id/status — Cập nhật trạng thái đơn hàng

DELETE /api/v1/orders/:id — Xóa đơn hàng

🛒 Giỏ hàng (Cart)

GET /api/v1/cart/ — Lấy giỏ hàng hiện tại (cần đăng nhập)

POST /api/v1/cart/items — Thêm sản phẩm vào giỏ hàng

PUT /api/v1/cart/items/:itemId — Cập nhật số lượng sản phẩm

DELETE /api/v1/cart/items/:itemId — Xóa sản phẩm khỏi giỏ hàng

DELETE /api/v1/cart/ — Xóa toàn bộ giỏ hàng

🏠 Địa chỉ (Addresses)

GET /api/v1/addresses/ — Lấy danh sách địa chỉ của người dùng

POST /api/v1/addresses/ — Thêm địa chỉ mới

PUT /api/v1/addresses/:id — Cập nhật địa chỉ

DELETE /api/v1/addresses/:id — Xóa địa chỉ

POST /api/v1/addresses/:id/default — Đặt địa chỉ mặc định

GET /api/v1/addresses/:id — Lấy địa chỉ theo ID

📝 Ghi chú

API_PREFIX có thể thay đổi qua biến môi trường env.API_PREFIX (mặc định là /api/v1).

Các route người dùng hiện tại có đoạn /users/users do định nghĩa router → có thể cân nhắc refactor để ngắn gọn hơn.

📌 Gợi ý: Bạn có thể dùng Swagger UI (/api-docs) để thử nghiệm và test tất cả các endpoint trực tiếp mà không cần dùng Postman.

<!-- Thêm  -->

GET
/api/v1/users/me/security
Lấy thông tin bảo mật tài khoản
POST /api/v1/users/me/2fa/enable Kích hoạt xác thực 2 lớp (2FA)
POST /api/v1/users/me/2fa/verify Xác minh mã 2FA khi đăng nhập
DELETE /api/v1/users/me Xóa tài khoản (yêu cầu xác minh)

Wishlist & Sản phẩm yêu thích ❤️

GET /api/v1/wishlist/ Lấy danh sách sản phẩm yêu thích
POST /api/v1/wishlist/:productId Thêm sản phẩm vào wishlist
DELETE /api/v1/wishlist/:productId Xóa sản phẩm khỏi wishlist
DELETE /api/v1/wishlist/ Xóa toàn bộ wishlist

Đánh giá & Bình luận sản phẩm (Reviews & Ratings)

✅ Mục tiêu: Cho phép người dùng đánh giá sản phẩm, cải thiện độ tin cậy.

Phương thức Endpoint Chức năng
GET /api/v1/products/:id/reviews Lấy danh sách đánh giá của sản phẩm
POST /api/v1/products/:id/reviews Gửi đánh giá sản phẩm
PUT /api/v1/reviews/:reviewId Cập nhật đánh giá
DELETE /api/v1/reviews/:reviewId Xóa đánh giá
GET /api/v1/reviews/user Lấy danh sách đánh giá của người dùng hiện tại
Thông báo (Notifications)

✅ Mục tiêu: Cập nhật thông tin đơn hàng, khuyến mãi, trạng thái tài khoản.

Phương thức Endpoint Chức năng
GET /api/v1/notifications/ Lấy danh sách thông báo
PATCH /api/v1/notifications/:id/read Đánh dấu thông báo đã đọc
PATCH /api/v1/notifications/read-all Đánh dấu tất cả đã đọc
DELETE /api/v1/notifications/:id Xóa thông báo
Thanh toán (Payment)

✅ Mục tiêu: Cho phép thanh toán trực tiếp qua cổng thanh toán.

Phương thức Endpoint Chức năng
POST /api/v1/payments/checkout Tạo yêu cầu thanh toán
GET /api/v1/payments/status/:orderId Kiểm tra trạng thái thanh toán
POST /api/v1/payments/webhook Nhận webhook từ cổng thanh toán
GET /api/v1/payments/history Lịch sử thanh toán của người dùng

Báo cáo & Quản trị nâng cao (Admin Tools)

✅ Mục tiêu: Cung cấp cho admin nhiều dữ liệu quản trị hơn.

Phương thức Endpoint Chức năng
GET /api/v1/admin/logs Lấy danh sách log hệ thống
GET /api/v1/admin/users/statistics Thống kê người dùng (tăng trưởng, hoạt động)
GET /api/v1/admin/products/statistics Thống kê sản phẩm (bán chạy, tồn kho)
POST
/api/v1/change-method-otp thay đổi phương thức otp

6. Quản trị hệ thống (Admin Panel)

Giúp bạn dễ dàng quản lý tất cả từ phía admin.

GET /admin/users – Danh sách người dùng

PUT /admin/users/:id/role – Gán quyền người dùng

DELETE /admin/users/:id – Xóa tài khoản

GET /admin/logs – Xem log hệ thống

GET /admin/config – Lấy cấu hình hệ thống

PUT /admin/config – Cập nhật cấu hình hệ thống
