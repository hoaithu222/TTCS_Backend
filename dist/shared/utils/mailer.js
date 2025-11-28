"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmailService = exports.sendEmail = void 0;
const nodemailer = __importStar(require("nodemailer"));
const env_config_1 = require("../config/env.config");
class SendEmailService {
    constructor() {
        this.transporter = null;
        const emailUser = process.env.EMAIL_USER || env_config_1.env.SMTP_USER;
        const emailPass = process.env.EMAIL_PASS || env_config_1.env.SMTP_PASS;
        const smtpHost = process.env.SMTP_HOST || env_config_1.env.SMTP_HOST || "smtp.gmail.com";
        const smtpPort = parseInt(process.env.SMTP_PORT || String(env_config_1.env.SMTP_PORT || 587));
        const smtpSecure = process.env.SMTP_SECURE === "true" || env_config_1.env.SMTP_SECURE;
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
        }
        else {
            console.warn("[MAILER] EMAIL_USER hoặc EMAIL_PASS chưa được cấu hình trong .env. Email sẽ không được gửi.");
        }
    }
    async sendEmail({ sendTo, subject, html, }) {
        if (!this.transporter) {
            console.error("[MAILER] Transporter chưa được khởi tạo. Vui lòng cấu hình EMAIL_USER và EMAIL_PASS trong .env");
            return { success: false, error: "Transporter chưa được cấu hình" };
        }
        try {
            const emailUser = process.env.EMAIL_USER || env_config_1.env.SMTP_USER;
            const info = await this.transporter.sendMail({
                from: `"${env_config_1.env.APP_NAME}" <${emailUser}>`,
                to: sendTo,
                subject: subject,
                html: html,
            });
            console.log(`[MAILER] Email đã được gửi thành công đến ${sendTo}`);
            return { success: true, data: info };
        }
        catch (error) {
            console.error("[MAILER] Lỗi khi gửi email:", error);
            return { success: false, error };
        }
    }
}
exports.SendEmailService = SendEmailService;
// Tạo singleton instance
const sendEmailService = new SendEmailService();
// Export hàm sendEmail để tương thích với code cũ
const sendEmail = async (to, html, subject = "Notification") => {
    const result = await sendEmailService.sendEmail({
        sendTo: to,
        subject,
        html,
    });
    if (!result.success) {
        throw new Error(result.error?.message || "Không thể gửi email");
    }
};
exports.sendEmail = sendEmail;
exports.default = sendEmailService;
