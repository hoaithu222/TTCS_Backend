"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forgotPasswordOtpEmailTemplate = ({ userName, otpCode, appName = "SHOPONLINE", }) => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${appName} - Đặt lại mật khẩu</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #0f172a;
          font-family: "Segoe UI", Roboto, Arial, sans-serif;
        }
        .wrapper {
          max-width: 560px;
          margin: 0 auto;
          padding: 32px 24px 48px;
          background: linear-gradient(145deg, #0f172a, #1e1b4b);
          border-radius: 24px;
          color: #e2e8f0;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.4);
        }
        .brand {
          text-align: center;
          margin-bottom: 32px;
        }
        .brand-title {
          font-size: 28px;
          color: #38bdf8;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 18px;
          padding: 32px;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #f8fafc;
        }
        .subtitle {
          font-size: 16px;
          color: #cbd5f5;
          margin-bottom: 28px;
          line-height: 1.6;
        }
        .otp-box {
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin-bottom: 24px;
        }
        .otp-label {
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 2px;
          color: #bae6fd;
        }
        .otp-code {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 12px;
          color: #38bdf8;
          margin: 12px 0 0;
        }
        .cta {
          display: block;
          text-align: center;
          margin-top: 16px;
          padding: 14px 24px;
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          border-radius: 12px;
          color: #fff;
          font-weight: 600;
          text-decoration: none;
        }
        .note {
          font-size: 13px;
          color: #cbd5f5;
          line-height: 1.7;
        }
        .footer {
          margin-top: 32px;
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="brand">
          <div class="brand-title">${appName}</div>
        </div>
        <div class="card">
          <div class="title">Đặt lại mật khẩu ${appName}</div>
          <div class="subtitle">
            Xin chào <strong>${userName}</strong>, <br />
            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>${appName}</strong>.
            Vui lòng sử dụng mã OTP bên dưới trong vòng 10 phút để tiếp tục.
          </div>
          <div class="otp-box">
            <div class="otp-label">Mã OTP của bạn</div>
            <div class="otp-code">${otpCode}</div>
          </div>
          <div class="note">
            Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Không chia sẻ mã OTP với bất kỳ ai.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} ${appName}. Mọi quyền được bảo lưu.
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.default = forgotPasswordOtpEmailTemplate;
