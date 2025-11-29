import { Request, Response } from "express";
import PaymentService from "./payment.service";
import { PaymentWebhookHandler, TestPaymentGateway } from "./payment-gateway.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import { webhookReceiverController as walletWebhookReceiverController } from "../wallet/webhook.controller";

/**
 * Get available payment methods
 */
export const getPaymentMethodsController = async (
  req: Request,
  res: Response
) => {
  const methods = await PaymentService.getPaymentMethods();
  return ResponseUtil.success(res, { methods }, "Payment methods retrieved successfully");
};

/**
 * Create payment checkout
 */
export const createCheckoutController = async (
  req: Request,
  res: Response
) => {
  const result = await PaymentService.createCheckout(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.checkout, "Checkout created successfully");
};

/**
 * Get payment status
 */
export const getPaymentStatusController = async (
  req: Request,
  res: Response
) => {
  const { orderId } = req.params;
  const result = await PaymentService.getPaymentStatus(
    req as AuthenticatedRequest,
    orderId
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { payment: result.payment, status: result.payment.status },
    "Payment status retrieved successfully"
  );
};

/**
 * Get payment history
 */
export const getPaymentHistoryController = async (
  req: Request,
  res: Response
) => {
  const result = await PaymentService.getPaymentHistory(
    req as AuthenticatedRequest,
    req.query as any
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    result.payments,
    "Payment history retrieved successfully",
    200,
    1,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    }
  );
};

/**
 * Handle payment webhook from gateways
 */
export const handleWebhookController = async (
  req: Request,
  res: Response
) => {
  const { gateway } = req.params;
  const result = await PaymentWebhookHandler.handleWebhook(gateway, req.body);
  
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, 400);
  }
  
  // Return 200 OK for webhooks (gateways expect this)
  return res.status(200).json({ success: true, message: result.message });
};

/**
 * Handle Sepay webhook (mapped từ cấu hình URL SePay)
 * Endpoint: /api/v1/payments/webhook hoặc /api/v1/payment/webhook
 * Ủy quyền xử lý sang wallet webhook (nạp tiền ví / xác nhận chuyển khoản)
 */
export const handleSepayWebhookController = async (
  req: Request,
  res: Response
) => {
  // Tái sử dụng toàn bộ logic xử lý webhook trong module wallet
  return walletWebhookReceiverController(req, res);
};

/**
 * Process test payment (for testing only)
 */
export const processTestPaymentController = async (
  req: Request,
  res: Response
) => {
  if (process.env.NODE_ENV === "production") {
    return ResponseUtil.error(res, "Test payment not available in production", 403);
  }

  const { paymentId } = req.params;
  const { success = true } = req.body;

  const result = await TestPaymentGateway.processPayment(paymentId, success);
  
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, 400);
  }
  
  return ResponseUtil.success(res, { paymentId, success }, result.message);
};

/**
 * Confirm bank transfer payment manually
 */
export const confirmBankTransferController = async (
  req: Request,
  res: Response
) => {
  const { paymentId } = req.params;
  const { transactionId } = req.body;

  const result = await PaymentService.confirmBankTransfer(
    req as AuthenticatedRequest,
    paymentId,
    transactionId
  );
  
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  
  return ResponseUtil.success(res, result.payment, "Payment confirmed successfully");
};

