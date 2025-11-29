import { Router } from "express";
import {
  getPaymentMethodsController,
  createCheckoutController,
  getPaymentStatusController,
  getPaymentHistoryController,
  handleWebhookController,
  processTestPaymentController,
  confirmBankTransferController,
  handleSepayWebhookController,
} from "./payment.controller";
import { authenticateToken } from "../../shared/middlewares/auth.middleware";

const paymentRouter = Router();

// Get available payment methods (public or authenticated)
paymentRouter.get("/methods", getPaymentMethodsController);

// Create payment checkout (authenticated)
paymentRouter.post("/checkout", authenticateToken, createCheckoutController);

// Get payment status (authenticated)
paymentRouter.get("/status/:orderId", authenticateToken, getPaymentStatusController);

// Get payment history (authenticated)
paymentRouter.get("/history", authenticateToken, getPaymentHistoryController);

// Webhook endpoints (no auth required - gateways call these)
// 1) Generic gateway webhook (hiện tại chủ yếu dùng cho dev/test)
paymentRouter.post("/webhook/:gateway", handleWebhookController);
// 2) Sepay webhook (không có param gateway) - khớp với cấu hình SePay
paymentRouter.post("/webhook", handleSepayWebhookController);

// Test payment endpoint (development only)
paymentRouter.post("/test/:paymentId", processTestPaymentController);

// Confirm bank transfer manually (authenticated)
paymentRouter.post("/confirm/:paymentId", authenticateToken, confirmBankTransferController);

export default paymentRouter;

