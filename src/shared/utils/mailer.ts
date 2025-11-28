import * as nodemailer from "nodemailer";
import { env } from "../config/env.config";

class SendEmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const emailUser = process.env.EMAIL_USER || env.SMTP_USER;
    const emailPass = process.env.EMAIL_PASS || env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || String(env.SMTP_PORT || 587));
    const smtpSecure = process.env.SMTP_SECURE === "true" || env.SMTP_SECURE;

    if (emailUser && emailPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    } else {
      console.warn(
        "[MAILER] EMAIL_USER hoặc EMAIL_PASS chưa được cấu hình trong .env. Email sẽ không được gửi."
      );
    }
  }

  async sendEmail({
    sendTo,
    subject,
    html,
  }: {
    sendTo: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; data?: any; error?: any }> {
    if (!this.transporter) {
      console.error("[MAILER] Transporter chưa được khởi tạo. Vui lòng cấu hình EMAIL_USER và EMAIL_PASS trong .env");
      return { success: false, error: "Transporter chưa được cấu hình" };
    }

    try {
      const emailUser = process.env.EMAIL_USER || env.SMTP_USER;
      const info = await this.transporter.sendMail({
        from: `"${env.APP_NAME}" <${emailUser}>`,
        to: sendTo,
        subject: subject,
        html: html,
      });

      console.log(`[MAILER] Email đã được gửi thành công đến ${sendTo}`);
      return { success: true, data: info };
    } catch (error) {
      console.error("[MAILER] Lỗi khi gửi email:", error);
      return { success: false, error };
    }
  }
}

// Tạo singleton instance
const sendEmailService = new SendEmailService();

// Export hàm sendEmail để tương thích với code cũ
export const sendEmail = async (
  to: string,
  html: string,
  subject: string = "Notification"
): Promise<void> => {
  const result = await sendEmailService.sendEmail({
    sendTo: to,
    subject,
    html,
  });

  if (!result.success) {
    throw new Error(result.error?.message || "Không thể gửi email");
  }
};

// Export service class và instance
export { SendEmailService };
export default sendEmailService;
