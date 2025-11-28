"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTransactionConfirmationEmail = exports.buildTwoFactorRecommendationEmail = exports.buildVerifyAccountEmail = exports.getOtpEmailTemplateConfig = void 0;
const baseEmailLayout = ({ appName = "SHOPONLINE", userName, heroIcon = "🛡️", title, subtitle, highlightLabel, highlightValue, note, }) => {
    return `
  <!DOCTYPE html>
  <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title} - ${appName}</title>
      <style>
        body {
          margin: 0;
          padding: 24px;
          background: #0f172a;
          font-family: "Segoe UI", Roboto, Arial, sans-serif;
          color: #e2e8f0;
        }
        .wrapper {
          max-width: 560px;
          margin: 0 auto;
          background: linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,27,75,0.95));
          border-radius: 24px;
          padding: 40px 32px 48px;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.45);
          position: relative;
          overflow: hidden;
        }
        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #38bdf8;
          text-transform: uppercase;
        }
        .brand-badge span {
          font-size: 24px;
        }
        .card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 18px;
          padding: 32px;
          margin-top: 28px;
        }
        .card h2 {
          margin: 0;
          font-size: 26px;
          color: #f8fafc;
        }
        .card p {
          margin: 18px 0;
          color: #cbd5f5;
          line-height: 1.7;
          font-size: 15px;
        }
        .otp-box {
          margin: 28px 0 18px;
          padding: 28px 24px;
          border-radius: 16px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.35);
          text-align: center;
        }
        .otp-label {
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #93c5fd;
        }
        .otp-value {
          font-size: 38px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: 12px;
          margin-top: 10px;
        }
        .note {
          margin-top: 24px;
          font-size: 14px;
          color: #a5b4fc;
          line-height: 1.7;
        }
        .footer {
          margin-top: 36px;
          text-align: center;
          color: #94a3b8;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="brand-badge">
          <span>${heroIcon}</span>
          ${appName}
        </div>
        <div class="card">
          <h2>${title}</h2>
          <p>Xin chào <strong>${userName}</strong>,</p>
          <p>${subtitle}</p>
          ${highlightValue
        ? `<div class="otp-box">
                  <div class="otp-label">${highlightLabel ?? "MÃ OTP"}</div>
                  <div class="otp-value">${highlightValue}</div>
                </div>`
        : ""}
          ${note
        ? `<div class="note">${note}</div>`
        : ""}
        </div>
        <div class="footer">
          Email được gửi tự động từ ${appName}, vui lòng không trả lời thư này.<br/>
          © ${new Date().getFullYear()} ${appName}. All rights reserved.
        </div>
      </div>
    </body>
  </html>
  `;
};
const getOtpEmailTemplateConfig = (purpose, payload) => {
    const appName = payload.appName || "SHOPONLINE";
    switch (purpose) {
        case "login_2fa":
            return {
                subject: `${appName} - Mã OTP đăng nhập 2 bước`,
                html: baseEmailLayout({
                    ...payload,
                    appName,
                    title: "Xác minh đăng nhập 2 bước",
                    subtitle: "Bạn đang đăng nhập vào tài khoản của mình. Vui lòng nhập mã OTP bên dưới để hoàn tất đăng nhập.",
                    highlightLabel: "MÃ ĐĂNG NHẬP",
                    highlightValue: payload.otpCode,
                    note: "Nếu bạn không thực hiện thao tác này, hãy đổi mật khẩu ngay và liên hệ đội ngũ hỗ trợ.",
                }),
            };
        case "change_password":
            return {
                subject: `${appName} - OTP đổi mật khẩu`,
                html: baseEmailLayout({
                    ...payload,
                    appName,
                    title: "Xác nhận đổi mật khẩu",
                    subtitle: "Chúng tôi nhận được yêu cầu đổi mật khẩu từ bạn khi đang đăng nhập. Nhập mã OTP này để xác nhận.",
                    highlightLabel: "MÃ XÁC NHẬN",
                    highlightValue: payload.otpCode,
                    note: "Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua thư này và đổi mật khẩu ngay.",
                }),
            };
        case "verify_setting_change":
            return {
                subject: `${appName} - OTP xác nhận thay đổi bảo mật`,
                html: baseEmailLayout({
                    ...payload,
                    appName,
                    title: "Xác nhận thay đổi bảo mật",
                    subtitle: "Bạn đang thay đổi cài đặt bảo mật (OTP/2 bước). Mã bên dưới giúp chúng tôi đảm bảo chính bạn thực hiện.",
                    highlightLabel: "MÃ XÁC THỰC",
                    highlightValue: payload.otpCode,
                    note: "Nếu bạn không thực hiện thay đổi nào, hãy kiểm tra tài khoản ngay.",
                }),
            };
        case "setup_smart_otp":
            return {
                subject: `${appName} - OTP thiết lập Smart OTP`,
                html: baseEmailLayout({
                    ...payload,
                    appName,
                    title: "Thiết lập Smart OTP",
                    subtitle: "Nhập mã OTP để hoàn tất thiết lập Smart OTP cho tài khoản của bạn.",
                    highlightLabel: "MÃ SMART OTP",
                    highlightValue: payload.otpCode,
                    note: "Giữ bí mật mã này và không chia sẻ cho bất kỳ ai.",
                }),
            };
        case "change_smart_otp_password":
            return {
                subject: `${appName} - OTP đổi mật khẩu Smart OTP`,
                html: baseEmailLayout({
                    ...payload,
                    appName,
                    title: "Đổi mật khẩu Smart OTP",
                    subtitle: "Mã OTP bên dưới sẽ giúp bạn xác nhận việc đổi mật khẩu Smart OTP.",
                    highlightLabel: "MÃ XÁC THỰC",
                    highlightValue: payload.otpCode,
                    note: "Nếu không phải bạn thực hiện, hãy bỏ qua email này.",
                }),
            };
        case "forgot_password":
            return {
                subject: `${appName} - Yêu cầu đặt lại mật khẩu`,
                html: baseEmailLayout({
                    ...payload,
                    appName,
                    title: "Đặt lại mật khẩu",
                    subtitle: "Sử dụng mã OTP bên dưới để đặt lại mật khẩu tài khoản của bạn.",
                    highlightLabel: "MÃ ĐẶT LẠI",
                    highlightValue: payload.otpCode,
                    note: "Mã OTP có hiệu lực trong 10 phút.",
                }),
            };
        default:
            return {
                subject: `${appName} - Mã OTP xác minh`,
                html: baseEmailLayout({
                    ...payload,
                    appName,
                    title: "Mã OTP xác minh",
                    subtitle: "Mã OTP bên dưới giúp xác minh thao tác của bạn tại " + appName,
                    highlightLabel: "MÃ OTP",
                    highlightValue: payload.otpCode,
                }),
            };
    }
};
exports.getOtpEmailTemplateConfig = getOtpEmailTemplateConfig;
const buildVerifyAccountEmail = ({ userName, otpCode, appName = "SHOPONLINE", }) => {
    return {
        subject: `${appName} - Xác thực tài khoản của bạn`,
        html: baseEmailLayout({
            appName,
            userName,
            heroIcon: "📧",
            title: "Hoàn tất xác thực tài khoản",
            subtitle: "Chúng tôi cần xác nhận email này thuộc về bạn. Nhập mã OTP bên dưới để kích hoạt tài khoản.",
            highlightLabel: "MÃ KÍCH HOẠT",
            highlightValue: otpCode,
            note: "Sau khi kích hoạt, bạn có thể sử dụng đầy đủ tính năng của " + appName + ".",
        }),
    };
};
exports.buildVerifyAccountEmail = buildVerifyAccountEmail;
const buildTwoFactorRecommendationEmail = ({ userName, appName = "SHOPONLINE", }) => {
    return {
        subject: `${appName} - Kích hoạt xác minh 2 bước`,
        html: baseEmailLayout({
            appName,
            userName,
            heroIcon: "🔐",
            title: "Tăng cường bảo mật với xác minh 2 bước",
            subtitle: "Bật xác minh 2 bước để nhận OTP mỗi khi đăng nhập. Điều này giúp tài khoản của bạn an toàn hơn trước các truy cập lạ.",
            note: "Truy cập mục Bảo mật trong tài khoản để kích hoạt ngay hôm nay.",
        }),
    };
};
exports.buildTwoFactorRecommendationEmail = buildTwoFactorRecommendationEmail;
const buildTransactionConfirmationEmail = ({ userName, orderCode, amount, actionUrl, appName = "SHOPONLINE", }) => {
    const subtitle = `Đơn hàng ${orderCode} của bạn đã được xác nhận thanh toán với giá trị ${amount}.`;
    const note = "Nếu bạn không thực hiện giao dịch này, vui lòng liên hệ đội ngũ CSKH của chúng tôi ngay.";
    return {
        subject: `${appName} - Xác nhận thanh toán đơn hàng ${orderCode}`,
        html: baseEmailLayout({
            appName,
            userName,
            heroIcon: "🧾",
            title: "Xác nhận thanh toán",
            subtitle: actionUrl
                ? subtitle + ` Bạn có thể theo dõi tiến trình đơn hàng tại ${actionUrl}.`
                : subtitle,
            note,
        }),
    };
};
exports.buildTransactionConfirmationEmail = buildTransactionConfirmationEmail;
