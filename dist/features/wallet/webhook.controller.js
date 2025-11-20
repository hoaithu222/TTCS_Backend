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
exports.webhookReceiverController = exports.testWebhookController = void 0;
const wallet_service_1 = __importDefault(require("./wallet.service"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Test webhook endpoint for simulating bank transfers
 * This is for testing/demo purposes only
 * URL: POST /api/wallets/test-webhook
 */
const testWebhookController = async (req, res) => {
    try {
        const { transactionId, amount, status = "completed" } = req.body;
        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID is required",
            });
        }
        console.log("[Test Webhook] Simulating bank transfer:", {
            transactionId,
            amount,
            status,
        });
        // Simulate bank transfer confirmation
        if (status === "completed") {
            const result = await wallet_service_1.default.confirmDeposit(transactionId, `TEST_${Date.now()}`, amount || 0, "test");
            if (result.ok) {
                return res.status(200).json({
                    success: true,
                    message: "Test deposit confirmed successfully",
                    transaction: result.transaction,
                });
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: result.message,
                });
            }
        }
        else {
            // Mark as failed
            const { WalletTransactionModel, WalletTransactionStatus } = await Promise.resolve().then(() => __importStar(require("../../models/WalletModel")));
            const transaction = await WalletTransactionModel.findById(transactionId);
            if (transaction) {
                transaction.status = WalletTransactionStatus.FAILED;
                transaction.metadata = {
                    ...transaction.metadata,
                    testWebhook: true,
                    testStatus: status,
                };
                await transaction.save();
            }
            return res.status(200).json({
                success: true,
                message: "Test transaction marked as failed",
            });
        }
    }
    catch (error) {
        console.error("[Test Webhook] Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Error processing test webhook",
        });
    }
};
exports.testWebhookController = testWebhookController;
/**
 * Webhook receiver for bank transfer and VNPay notifications
 * This endpoint receives webhook from bank/payment gateway
 * URL: http://103.124.92.168:3000/api/wallets/webhook-receiver
 * VNPay IPN URL: http://103.124.92.168:3000/api/wallets/webhook-receiver
 */
const webhookReceiverController = async (req, res) => {
    try {
        // Log webhook data for debugging
        console.log("[Wallet Webhook] Received:", JSON.stringify(req.body, null, 2));
        console.log("[Wallet Webhook] Headers:", JSON.stringify(req.headers, null, 2));
        console.log("[Wallet Webhook] Query:", JSON.stringify(req.query, null, 2));
        const body = req.body;
        const query = req.query;
        // Check if this is a VNPay IPN (Instant Payment Notification)
        if (query.vnp_ResponseCode || body.vnp_ResponseCode) {
            return handleVNPayIPN(req, res);
        }
        // Extract transaction information from webhook
        // Adjust these fields based on actual webhook format from bank
        const transactionId = body.transactionId || body.id || body.txn_id;
        const amount = parseFloat(body.amount || body.amount || 0);
        const description = body.description || body.content || body.note || "";
        const status = body.status || body.state || "completed";
        // Extract deposit transaction ID from description
        // Format: "Nap tien {transactionId}"
        const depositMatch = description.match(/Nap tien\s+([a-f0-9]{24})/i);
        if (!depositMatch) {
            // Try to find transaction by bank transaction ID
            const existingTransaction = await Promise.resolve().then(() => __importStar(require("../../models/WalletModel"))).then((m) => m.WalletTransactionModel);
            const transaction = await existingTransaction.findOne({
                transactionId: transactionId,
                status: { $ne: "completed" },
            });
            if (transaction && status === "completed") {
                const result = await wallet_service_1.default.confirmDeposit(transaction._id.toString(), transactionId, amount);
                if (result.ok) {
                    return res.status(200).json({
                        success: true,
                        message: "Deposit confirmed successfully",
                    });
                }
            }
            return res.status(200).json({
                success: false,
                message: "No matching deposit transaction found",
            });
        }
        const depositTransactionId = depositMatch[1];
        if (status === "completed" || status === "success") {
            const result = await wallet_service_1.default.confirmDeposit(depositTransactionId, transactionId || `WEBHOOK_${Date.now()}`, amount);
            if (result.ok) {
                return res.status(200).json({
                    success: true,
                    message: "Deposit confirmed successfully",
                    transaction: result.transaction,
                });
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: result.message,
                });
            }
        }
        // Return 200 OK even if we don't process it (webhooks expect 200)
        return res.status(200).json({
            success: true,
            message: "Webhook received but not processed",
        });
    }
    catch (error) {
        console.error("[Wallet Webhook] Error:", error);
        // Always return 200 to webhook sender
        return res.status(200).json({
            success: false,
            message: error.message || "Error processing webhook",
        });
    }
};
exports.webhookReceiverController = webhookReceiverController;
/**
 * Handle VNPay IPN (Instant Payment Notification) for wallet deposit
 */
async function handleVNPayIPN(req, res) {
    try {
        const query = req.query;
        const vnpParams = {};
        // Extract VNPay parameters from query
        for (const key in query) {
            if (key.startsWith("vnp_")) {
                vnpParams[key] = query[key];
            }
        }
        // Verify VNPay signature
        const secretKey = process.env.VNPAY_HASH_SECRET || "";
        if (!secretKey) {
            console.error("[VNPay IPN] VNPay hash secret not configured");
            return res.status(200).json({ RspCode: "97", Message: "Config error" });
        }
        const secureHash = vnpParams["vnp_SecureHash"];
        delete vnpParams["vnp_SecureHash"];
        delete vnpParams["vnp_SecureHashType"];
        const signData = Object.keys(vnpParams)
            .sort()
            .map((key) => `${key}=${vnpParams[key]}`)
            .join("&");
        const signed = crypto_1.default
            .createHmac("sha512", secretKey)
            .update(signData)
            .digest("hex");
        if (secureHash !== signed) {
            console.error("[VNPay IPN] Invalid signature");
            return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
        }
        const responseCode = vnpParams["vnp_ResponseCode"];
        const transactionId = vnpParams["vnp_TxnRef"]; // This is our wallet transaction ID
        const vnpAmount = parseInt(vnpParams["vnp_Amount"] || "0") / 100; // VNPay returns amount in cents
        const vnpTransactionNo = vnpParams["vnp_TransactionNo"];
        console.log("[VNPay IPN] Processing:", {
            transactionId,
            responseCode,
            amount: vnpAmount,
            vnpTransactionNo,
        });
        // Check if this is a wallet deposit transaction (starts with wallet transaction ID)
        const { WalletTransactionModel } = await Promise.resolve().then(() => __importStar(require("../../models/WalletModel")));
        const transaction = await WalletTransactionModel.findById(transactionId);
        if (!transaction) {
            console.error("[VNPay IPN] Wallet transaction not found:", transactionId);
            return res.status(200).json({ RspCode: "01", Message: "Transaction not found" });
        }
        if (transaction.type !== "deposit") {
            console.error("[VNPay IPN] Not a deposit transaction");
            return res.status(200).json({ RspCode: "04", Message: "Invalid transaction type" });
        }
        if (transaction.status === "completed") {
            console.log("[VNPay IPN] Transaction already completed");
            return res.status(200).json({ RspCode: "00", Message: "Transaction already processed" });
        }
        // Process payment based on response code
        const { WalletTransactionStatus } = await Promise.resolve().then(() => __importStar(require("../../models/WalletModel")));
        // Response code "00" means success
        if (responseCode === "00") {
            const result = await wallet_service_1.default.confirmDeposit(transactionId, vnpTransactionNo, vnpAmount, "vnpay");
            if (result.ok) {
                console.log("[VNPay IPN] Deposit confirmed successfully");
                return res.status(200).json({ RspCode: "00", Message: "Success" });
            }
            else {
                console.error("[VNPay IPN] Failed to confirm deposit:", result.message);
                return res.status(200).json({ RspCode: "99", Message: result.message || "Failed" });
            }
        }
        else {
            // Payment failed - update transaction status
            const errorMessages = {
                "07": "Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)",
                "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
                "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
                "11": "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch",
                "12": "Thẻ/Tài khoản bị khóa",
                "13": "Nhập sai mật khẩu xác thực giao dịch (OTP)",
                "51": "Tài khoản không đủ số dư để thực hiện giao dịch",
                "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày",
                "75": "Ngân hàng thanh toán đang bảo trì",
                "79": "Nhập sai mật khẩu thanh toán quá số lần quy định",
            };
            const errorMessage = errorMessages[responseCode] || `Payment failed with code: ${responseCode}`;
            console.log("[VNPay IPN] Payment failed:", {
                responseCode,
                errorMessage,
                transactionId,
            });
            transaction.status = WalletTransactionStatus.FAILED;
            transaction.metadata = {
                ...transaction.metadata,
                vnpayResponseCode: responseCode,
                vnpayErrorMessage: errorMessage,
                failedAt: new Date().toISOString(),
            };
            await transaction.save();
            return res.status(200).json({
                RspCode: responseCode,
                Message: errorMessage
            });
        }
    }
    catch (error) {
        console.error("[VNPay IPN] Error:", error);
        return res.status(200).json({ RspCode: "99", Message: error.message || "Error" });
    }
}
