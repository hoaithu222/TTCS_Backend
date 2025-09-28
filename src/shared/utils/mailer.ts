// Lightweight mailer abstraction. Replace with real provider (e.g., nodemailer, SES) later.
export const sendEmail = async (
  to: string,
  url: string,
  subject: string = "Notification"
): Promise<void> => {
  // For now, just log. In production, integrate an email service.
  // This keeps service/controller code clean and testable.
  // eslint-disable-next-line no-console
  console.log(`[MAILER] to=${to} subject=${subject} url=${url}`);
};

export default {
  sendEmail,
};
