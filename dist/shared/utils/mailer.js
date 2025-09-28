"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
// Lightweight mailer abstraction. Replace with real provider (e.g., nodemailer, SES) later.
const sendEmail = async (to, url, subject = "Notification") => {
    // For now, just log. In production, integrate an email service.
    // This keeps service/controller code clean and testable.
    // eslint-disable-next-line no-console
    console.log(`[MAILER] to=${to} subject=${subject} url=${url}`);
};
exports.sendEmail = sendEmail;
exports.default = {
    sendEmail: exports.sendEmail,
};
