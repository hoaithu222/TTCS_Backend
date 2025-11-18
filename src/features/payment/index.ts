import { Router } from "express";
import {
  getPaymentMethodsController,
  createCheckoutController,
  getPaymentStatusController,
  getPaymentHistoryController,
  handleWebhookController,
  processTestPaymentController,
  confirmBankTransferController,
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
paymentRouter.post("/webhook/:gateway", handleWebhookController);

// Test payment endpoint (development only)
paymentRouter.post("/test/:paymentId", processTestPaymentController);

// Confirm bank transfer manually (authenticated)
paymentRouter.post("/confirm/:paymentId", authenticateToken, confirmBankTransferController);

export default paymentRouter;

