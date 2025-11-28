"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = require("../shared/config/env.config");
const verifyShopTemplate = ({ shopName, name, url, appName = env_config_1.env.APP_NAME || "Bán hàng", }) => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác minh Shop</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          padding: 20px;
          line-height: 1.6;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
          padding: 40px 30px;
          text-align: center;
          color: #ffffff;
        }
        .header-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 32px;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
          color: #333333;
        }
        .greeting {
          font-size: 18px;
          color: #333333;
          margin-bottom: 20px;
        }
        .greeting strong {
          color: #FF5722;
          font-weight: 600;
        }
        .message {
          font-size: 16px;
          color: #666666;
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .shop-name {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
          border-left: 4px solid #FF5722;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .shop-name strong {
          font-size: 20px;
          color: #FF5722;
          font-weight: 700;
        }
        .button-container {
          text-align: center;
          margin: 35px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 16px 40px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(255, 87, 34, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 87, 34, 0.5);
        }
        .info-box {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .info-box p {
          font-size: 14px;
          color: #1565c0;
          margin: 0;
        }
        .warning {
          background: #f8f9fa;
          border-left: 4px solid #dc3545;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .warning p {
          font-size: 14px;
          color: #721c24;
          margin: 0;
        }
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e9ecef;
        }
        .footer p {
          font-size: 14px;
          color: #6c757d;
          margin: 5px 0;
        }
        .footer-brand {
          font-weight: 600;
          color: #FF5722;
          font-size: 16px;
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e9ecef, transparent);
          margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
          .email-wrapper {
            margin: 10px;
            border-radius: 12px;
          }
          .header, .content, .footer {
            padding: 25px 20px;
          }
          .button {
            padding: 14px 30px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <div class="header-icon">🏪</div>
          <h1>Xác minh Shop</h1>
          <p>Kích hoạt shop của bạn</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Xin chào <strong>${name}</strong>!
          </div>
          
          <div class="message">
            Cảm ơn bạn đã tạo shop trên nền tảng <strong>${appName}</strong>!
            Để kích hoạt shop và bắt đầu bán hàng, vui lòng xác minh địa chỉ email của shop bằng cách nhấn vào nút bên dưới.
          </div>
          
          <div class="shop-name">
            <strong>${shopName}</strong>
          </div>
          
          <div class="button-container">
            <a href="${url}" class="button">Xác minh Shop</a>
          </div>
          
          <div class="info-box">
            <p>💡 Sau khi xác minh, shop của bạn sẽ được kích hoạt và bạn có thể bắt đầu đăng sản phẩm, quản lý đơn hàng và nhận thanh toán.</p>
          </div>
          
          <div class="warning">
            <p>🔒 <strong>Lưu ý:</strong> Nếu bạn không tạo shop này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay lập tức.</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="message" style="font-size: 14px; color: #999999; text-align: center;">
            Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br>
            <a href="${url}" style="color: #FF5722; word-break: break-all;">${url}</a>
          </div>
        </div>
        
        <div class="footer">
          <p class="footer-brand">${appName}</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          <p>© ${new Date().getFullYear()} ${appName}. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.default = verifyShopTemplate;
