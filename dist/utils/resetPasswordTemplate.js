"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = require("../shared/config/env.config");
const resetPasswordWithOtpTemplate = ({ userName, resetLink, otpCode, appName = env_config_1.env.APP_NAME || "Bán hàng", }) => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đặt lại mật khẩu</title>
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
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
          color: #f5576c;
          font-weight: 600;
        }
        .message {
          font-size: 16px;
          color: #666666;
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .otp-container {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-label {
          font-size: 14px;
          color: #666666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .otp-code {
          font-size: 42px;
          font-weight: 700;
          color: #f5576c;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          background: #ffffff;
          padding: 20px;
          border-radius: 8px;
          display: inline-block;
          box-shadow: 0 4px 12px rgba(245, 87, 108, 0.2);
        }
        .button-container {
          text-align: center;
          margin: 35px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 16px 40px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 87, 108, 0.5);
        }
        .expiry-info {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .expiry-info p {
          font-size: 14px;
          color: #856404;
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
          color: #f5576c;
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
          .otp-code {
            font-size: 32px;
            letter-spacing: 4px;
            padding: 15px;
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
          <div class="header-icon">🔐</div>
          <h1>Đặt lại mật khẩu</h1>
          <p>Yêu cầu đặt lại mật khẩu của bạn</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Xin chào <strong>${userName}</strong>!
          </div>
          
          <div class="message">
            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>${appName}</strong>.
            Để tiếp tục, vui lòng sử dụng mã OTP bên dưới và nhấn vào nút để truy cập trang đặt lại mật khẩu.
          </div>
          
          <div class="otp-container">
            <div class="otp-label">Mã OTP</div>
            <div class="otp-code">${otpCode}</div>
          </div>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Đặt lại mật khẩu</a>
          </div>
          
          <div class="expiry-info">
            <p>⏰ Mã OTP này sẽ hết hạn trong <strong>10 phút</strong>. Vui lòng sử dụng ngay.</p>
          </div>
          
          <div class="warning">
            <p>🔒 <strong>Lưu ý bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="message" style="font-size: 14px; color: #999999; text-align: center;">
            Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br>
            <a href="${resetLink}" style="color: #f5576c; word-break: break-all;">${resetLink}</a>
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
exports.default = resetPasswordWithOtpTemplate;
