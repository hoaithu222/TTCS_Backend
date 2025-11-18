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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentWebhookHandler = exports.TestPaymentGateway = exports.VNPayGateway = void 0;
const PaymentModel_1 = __importStar(require("../../models/PaymentModel"));
const OrderModel_1 = __importStar(require("../../models/OrderModel"));
const crypto_1 = __importDefault(require("crypto"));
const formatVNPayDate = (date) => {
    const pad = (value) => value.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    return `${year}${month}${day}${hour}${minute}${second}`;
};
class VNPayGateway {
    static generatePaymentUrl({ paymentId, amount, orderId, clientIp, returnUrl, }) {
        const tmnCode = process.env.VNPAY_TMN_CODE || "";
        const secretKey = process.env.VNPAY_HASH_SECRET || "";
        const vnpUrl = process.env.VNPAY_URL ||
            "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        if (!tmnCode || !secretKey) {
            throw new Error("VNPay chưa được cấu hình đầy đủ");
        }
        const createDate = new Date();
        const expireDate = new Date(createDate.getTime() + 15 * 60 * 1000);
        const params = {
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_TmnCode: tmnCode,
            vnp_Locale: "vn",
            vnp_CurrCode: "VND",
            vnp_TxnRef: paymentId,
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: "other",
            vnp_Amount: String(Math.round(Math.max(amount, 0) * 100)),
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: clientIp,
            vnp_CreateDate: formatVNPayDate(createDate),
            vnp_ExpireDate: formatVNPayDate(expireDate),
        };
        const query = Object.keys(params)
            .sort()
            .map((key) => `${key}=${encodeURIComponent(params[key])}`)
            .join("&");
        const secureHash = crypto_1.default
            .createHmac("sha512", secretKey)
            .update(Buffer.from(query, "utf-8"))
            .digest("hex");
        return {
            paymentUrl: `${vnpUrl}?${query}&vnp_SecureHash=${secureHash}`,
            expiresAt: expireDate,
        };
    }
}
exports.VNPayGateway = VNPayGateway;
/**
 * Test Payment Gateway Service
 * Simulates payment processing for testing purposes
 */
class TestPaymentGateway {
    /**
     * Generate test payment URL
     */
    static generatePaymentUrl(paymentId, amount) {
        const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return `${baseUrl}/payment/test/${paymentId}?amount=${amount}`;
    }
    /**
     * Simulate payment processing
     * In real scenario, this would be called by webhook from payment gateway
     */
    static async processPayment(paymentId, success = true) {
        try {
            const payment = await PaymentModel_1.default.findById(paymentId);
            if (!payment) {
                return { ok: false, message: "Payment not found" };
            }
            if (payment.status !== PaymentModel_1.PaymentStatus.PENDING) {
                return { ok: false, message: "Payment already processed" };
            }
            // Update payment status
            payment.status = success ? PaymentModel_1.PaymentStatus.COMPLETED : PaymentModel_1.PaymentStatus.FAILED;
            payment.transactionId = `TEST_${Date.now()}_${crypto_1.default.randomBytes(4).toString("hex")}`;
            payment.paidAt = success ? new Date() : undefined;
            payment.gatewayResponse = {
                success,
                processedAt: new Date().toISOString(),
                testMode: true,
            };
            await payment.save();
            // Update order status if payment successful
            if (success) {
                await OrderModel_1.default.findByIdAndUpdate(payment.orderId, {
                    isPay: true,
                    status: OrderModel_1.OrderStatus.PROCESSING,
                });
            }
            return {
                ok: true,
                message: success ? "Payment processed successfully" : "Payment failed",
            };
        }
        catch (error) {
            return { ok: false, message: error.message || "Failed to process payment" };
        }
    }
}
exports.TestPaymentGateway = TestPaymentGateway;
/**
 * Webhook handler for payment gateways
 */
class PaymentWebhookHandler {
    /**
     * Handle VNPay webhook
     */
    static async handleVNPayWebhook(data) {
        try {
            // TODO: Verify VNPay signature
            // const isValid = this.verifyVNPaySignature(data);
            // if (!isValid) {
            //   return { ok: false, message: "Invalid signature" };
            // }
            const paymentId = data.vnp_TxnRef; // Payment ID should be stored in vnp_TxnRef
            const responseCode = data.vnp_ResponseCode;
            const isSuccess = responseCode === "00";
            const payment = await PaymentModel_1.default.findById(paymentId);
            if (!payment) {
                return { ok: false, message: "Payment not found" };
            }
            if (payment.status !== PaymentModel_1.PaymentStatus.PENDING) {
                return { ok: true, message: "Payment already processed" };
            }
            // Update payment
            payment.status = isSuccess ? PaymentModel_1.PaymentStatus.COMPLETED : PaymentModel_1.PaymentStatus.FAILED;
            payment.transactionId = data.vnp_TransactionNo;
            payment.paidAt = isSuccess ? new Date() : undefined;
            payment.gatewayResponse = data;
            await payment.save();
            // Update order if successful
            if (isSuccess) {
                await OrderModel_1.default.findByIdAndUpdate(payment.orderId, {
                    isPay: true,
                    status: OrderModel_1.OrderStatus.PROCESSING,
                });
            }
            return { ok: true, message: "Webhook processed" };
        }
        catch (error) {
            return { ok: false, message: error.message || "Failed to process webhook" };
        }
    }
    /**
     * Handle MoMo webhook
     */
    static async handleMoMoWebhook(data) {
        try {
            // TODO: Verify MoMo signature
            const paymentId = data.orderId;
            const resultCode = data.resultCode;
            const isSuccess = resultCode === 0;
            const payment = await PaymentModel_1.default.findById(paymentId);
            if (!payment) {
                return { ok: false, message: "Payment not found" };
            }
            if (payment.status !== PaymentModel_1.PaymentStatus.PENDING) {
                return { ok: true, message: "Payment already processed" };
            }
            payment.status = isSuccess ? PaymentModel_1.PaymentStatus.COMPLETED : PaymentModel_1.PaymentStatus.FAILED;
            payment.transactionId = data.transId;
            payment.paidAt = isSuccess ? new Date() : undefined;
            payment.gatewayResponse = data;
            await payment.save();
            if (isSuccess) {
                await OrderModel_1.default.findByIdAndUpdate(payment.orderId, {
                    isPay: true,
                    status: OrderModel_1.OrderStatus.PROCESSING,
                });
            }
            return { ok: true, message: "Webhook processed" };
        }
        catch (error) {
            return { ok: false, message: error.message || "Failed to process webhook" };
        }
    }
    /**
     * Handle ZaloPay webhook
     */
    static async handleZaloPayWebhook(data) {
        try {
            // TODO: Verify ZaloPay signature
            const paymentId = data.app_trans_id;
            const returnCode = data.return_code;
            const isSuccess = returnCode === 1;
            const payment = await PaymentModel_1.default.findById(paymentId);
            if (!payment) {
                return { ok: false, message: "Payment not found" };
            }
            if (payment.status !== PaymentModel_1.PaymentStatus.PENDING) {
                return { ok: true, message: "Payment already processed" };
            }
            payment.status = isSuccess ? PaymentModel_1.PaymentStatus.COMPLETED : PaymentModel_1.PaymentStatus.FAILED;
            payment.transactionId = data.zp_trans_id;
            payment.paidAt = isSuccess ? new Date() : undefined;
            payment.gatewayResponse = data;
            await payment.save();
            if (isSuccess) {
                await OrderModel_1.default.findByIdAndUpdate(payment.orderId, {
                    isPay: true,
                    status: OrderModel_1.OrderStatus.PROCESSING,
                });
            }
            return { ok: true, message: "Webhook processed" };
        }
        catch (error) {
            return { ok: false, message: error.message || "Failed to process webhook" };
        }
    }
    /**
     * Generic webhook handler
     */
    static async handleWebhook(gateway, data) {
        switch (gateway.toLowerCase()) {
            case "vnpay":
                return this.handleVNPayWebhook(data);
            case "momo":
                return this.handleMoMoWebhook(data);
            case "zalopay":
                return this.handleZaloPayWebhook(data);
            case "test":
                return TestPaymentGateway.processPayment(data.paymentId, data.success !== false);
            default:
                return { ok: false, message: "Unknown gateway" };
        }
    }
}
exports.PaymentWebhookHandler = PaymentWebhookHandler;
