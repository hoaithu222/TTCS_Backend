"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmBankTransferController = exports.processTestPaymentController = exports.handleWebhookController = exports.getPaymentHistoryController = exports.getPaymentStatusController = exports.createCheckoutController = exports.getPaymentMethodsController = void 0;
const payment_service_1 = __importDefault(require("./payment.service"));
const payment_gateway_service_1 = require("./payment-gateway.service");
const response_util_1 = require("../../shared/utils/response.util");
/**
 * Get available payment methods
 */
const getPaymentMethodsController = async (req, res) => {
    const methods = await payment_service_1.default.getPaymentMethods();
    return response_util_1.ResponseUtil.success(res, { methods }, "Payment methods retrieved successfully");
};
exports.getPaymentMethodsController = getPaymentMethodsController;
/**
 * Create payment checkout
 */
const createCheckoutController = async (req, res) => {
    const result = await payment_service_1.default.createCheckout(req, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.checkout, "Checkout created successfully");
};
exports.createCheckoutController = createCheckoutController;
/**
 * Get payment status
 */
const getPaymentStatusController = async (req, res) => {
    const { orderId } = req.params;
    const result = await payment_service_1.default.getPaymentStatus(req, orderId);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { payment: result.payment, status: result.payment.status }, "Payment status retrieved successfully");
};
exports.getPaymentStatusController = getPaymentStatusController;
/**
 * Get payment history
 */
const getPaymentHistoryController = async (req, res) => {
    const result = await payment_service_1.default.getPaymentHistory(req, req.query);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.payments, "Payment history retrieved successfully", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
    });
};
exports.getPaymentHistoryController = getPaymentHistoryController;
/**
 * Handle payment webhook from gateways
 */
const handleWebhookController = async (req, res) => {
    const { gateway } = req.params;
    const result = await payment_gateway_service_1.PaymentWebhookHandler.handleWebhook(gateway, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, 400);
    }
    // Return 200 OK for webhooks (gateways expect this)
    return res.status(200).json({ success: true, message: result.message });
};
exports.handleWebhookController = handleWebhookController;
/**
 * Process test payment (for testing only)
 */
const processTestPaymentController = async (req, res) => {
    if (process.env.NODE_ENV === "production") {
        return response_util_1.ResponseUtil.error(res, "Test payment not available in production", 403);
    }
    const { paymentId } = req.params;
    const { success = true } = req.body;
    const result = await payment_gateway_service_1.TestPaymentGateway.processPayment(paymentId, success);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, 400);
    }
    return response_util_1.ResponseUtil.success(res, { paymentId, success }, result.message);
};
exports.processTestPaymentController = processTestPaymentController;
/**
 * Confirm bank transfer payment manually
 */
const confirmBankTransferController = async (req, res) => {
    const { paymentId } = req.params;
    const { transactionId } = req.body;
    const result = await payment_service_1.default.confirmBankTransfer(req, paymentId, transactionId);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.payment, "Payment confirmed successfully");
};
exports.confirmBankTransferController = confirmBankTransferController;
