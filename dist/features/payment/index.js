"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const paymentRouter = (0, express_1.Router)();
// Get available payment methods (public or authenticated)
paymentRouter.get("/methods", payment_controller_1.getPaymentMethodsController);
// Create payment checkout (authenticated)
paymentRouter.post("/checkout", auth_middleware_1.authenticateToken, payment_controller_1.createCheckoutController);
// Get payment status (authenticated)
paymentRouter.get("/status/:orderId", auth_middleware_1.authenticateToken, payment_controller_1.getPaymentStatusController);
// Get payment history (authenticated)
paymentRouter.get("/history", auth_middleware_1.authenticateToken, payment_controller_1.getPaymentHistoryController);
// Webhook endpoints (no auth required - gateways call these)
paymentRouter.post("/webhook/:gateway", payment_controller_1.handleWebhookController);
// Test payment endpoint (development only)
paymentRouter.post("/test/:paymentId", payment_controller_1.processTestPaymentController);
// Confirm bank transfer manually (authenticated)
paymentRouter.post("/confirm/:paymentId", auth_middleware_1.authenticateToken, payment_controller_1.confirmBankTransferController);
exports.default = paymentRouter;
