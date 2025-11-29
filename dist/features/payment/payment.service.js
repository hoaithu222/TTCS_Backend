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
const PaymentModel_1 = __importStar(require("../../models/PaymentModel"));
const OrderModel_1 = __importStar(require("../../models/OrderModel"));
const notification_service_1 = require("../../shared/services/notification.service");
const CLIENT_APP_URL = process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5174";
// Sepay test mode: giới hạn số tiền thực chuyển để test (QR amount < 10.000 VNĐ)
const SEPAY_TEST_MODE = process.env.SEPAY_TEST_MODE === "true" || process.env.NODE_ENV !== "production";
const SEPAY_TEST_MAX_AMOUNT = Number.parseInt(process.env.SEPAY_TEST_MAX_AMOUNT || "9000", 10) || 9000;
const getSepayAmount = (originalAmount) => {
    if (!SEPAY_TEST_MODE)
        return originalAmount;
    return Math.max(1000, Math.min(originalAmount, SEPAY_TEST_MAX_AMOUNT));
};
class PaymentService {
    /**
     * Get available payment methods
     * This can be extended to fetch from database or config
     */
    static async getPaymentMethods() {
        const methods = [
            {
                id: "cod",
                name: "Thanh toán khi nhận hàng",
                type: PaymentModel_1.PaymentMethod.COD,
                isActive: true,
                description: "Thanh toán bằng tiền mặt khi nhận hàng",
                icon: "cash",
            },
            {
                id: "bank_transfer",
                name: "Chuyển khoản qua ngân hàng (Sepay)",
                type: PaymentModel_1.PaymentMethod.BANK_TRANSFER,
                isActive: true,
                description: "Chuyển khoản qua QR ngân hàng/Sepay vào tài khoản của cửa hàng",
                icon: "bank",
                config: {
                    bankAccounts: [
                        {
                            bankName: process.env.BANK_NAME || "MBBank",
                            accountNumber: process.env.BANK_ACCOUNT_NUMBER || "0000000000",
                            accountHolder: process.env.BANK_ACCOUNT_HOLDER || "Cửa hàng",
                        },
                    ],
                },
            },
            {
                id: "wallet",
                name: "Thanh toán bằng ví",
                type: PaymentModel_1.PaymentMethod.WALLET,
                isActive: true,
                description: "Thanh toán bằng số dư trong ví của bạn",
                icon: "wallet",
            },
        ];
        // Filter only active methods
        return methods.filter((method) => method.isActive);
    }
    /**
     * Create payment checkout
     */
    static async createCheckout(req, data) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            // Verify order exists and belongs to user
            const order = await OrderModel_1.default.findOne({
                _id: data.orderId,
                userId: userId,
            });
            if (!order) {
                return {
                    ok: false,
                    status: 404,
                    message: "Order not found",
                };
            }
            // Build default URLs
            const defaultReturnUrl = data.returnUrl ||
                PaymentService.buildReturnUrl(order._id.toString());
            const defaultCancelUrl = data.cancelUrl || PaymentService.buildCancelUrl(order._id.toString());
            // Check if payment already exists for this order
            const existingPayment = await PaymentModel_1.default.findOne({
                orderId: data.orderId,
                userId: userId,
            });
            // If payment already exists, return existing payment info
            if (existingPayment) {
                const paymentObj = existingPayment.toObject();
                let response = {
                    paymentId: paymentObj._id.toString(),
                    paymentUrl: undefined,
                    instructions: paymentObj.instructions || undefined,
                };
                // If payment is completed, return existing payment (no need to create new)
                if (existingPayment.status === PaymentModel_1.PaymentStatus.COMPLETED) {
                    return {
                        ok: true,
                        checkout: response,
                    };
                }
                // If payment is pending/processing, return existing payment
                if (existingPayment.status === PaymentModel_1.PaymentStatus.PENDING ||
                    existingPayment.status === PaymentModel_1.PaymentStatus.PROCESSING) {
                    return {
                        ok: true,
                        checkout: response,
                    };
                }
                // If payment is failed/cancelled, allow creating new payment with different method
                // But check if user wants to use the same method or different method
                const availableMethods = await this.getPaymentMethods();
                const methodExists = availableMethods.find((m) => m.id === data.paymentMethod || m.type === data.paymentMethod);
                // If same method and failed, return existing (user can retry)
                if (existingPayment.method === methodExists?.type &&
                    (existingPayment.status === PaymentModel_1.PaymentStatus.FAILED ||
                        existingPayment.status === PaymentModel_1.PaymentStatus.CANCELLED)) {
                    return {
                        ok: true,
                        checkout: response,
                    };
                }
                // If different method, continue to create new payment below
                // (existing payment will remain in DB but new one will be created)
            }
            // Validate payment method
            const availableMethods = await this.getPaymentMethods();
            const methodExists = availableMethods.find((m) => m.id === data.paymentMethod || m.type === data.paymentMethod);
            if (!methodExists) {
                return {
                    ok: false,
                    status: 400,
                    message: "Invalid payment method",
                };
            }
            const payment = new PaymentModel_1.default({
                orderId: data.orderId,
                userId: userId,
                amount: Math.max(0, order.totalAmount || 0),
                currency: "VND",
                method: methodExists.type,
                status: PaymentModel_1.PaymentStatus.PENDING,
                returnUrl: defaultReturnUrl,
                cancelUrl: defaultCancelUrl,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            });
            let response = {
                paymentId: payment._id.toString(),
                paymentUrl: undefined,
                instructions: undefined,
                qrCode: undefined,
            };
            switch (methodExists.type) {
                case PaymentModel_1.PaymentMethod.COD: {
                    payment.status = PaymentModel_1.PaymentStatus.COMPLETED;
                    payment.paidAt = new Date();
                    payment.instructions = "Vui lòng chuẩn bị tiền mặt khi nhận hàng.";
                    response.instructions = payment.instructions;
                    await OrderModel_1.default.findByIdAndUpdate(order._id, {
                        isPay: true,
                        status: OrderModel_1.OrderStatus.PROCESSING,
                    });
                    break;
                }
                case PaymentModel_1.PaymentMethod.BANK_TRANSFER: {
                    const bankAccounts = methodExists.config?.bankAccounts || [];
                    payment.instructions = PaymentService.buildBankTransferInstructions(order._id.toString(), bankAccounts);
                    // Tạo QR Sepay cho chuyển khoản ngân hàng
                    const bankInfo = bankAccounts[0];
                    if (bankInfo) {
                        const QR_CODE_BASE_URL = "https://qr.sepay.vn/img";
                        const description = encodeURIComponent(`Thanh toan don hang ${order._id.toString()}`);
                        const sepayAmount = getSepayAmount(payment.amount);
                        const qrCodeUrl = `${QR_CODE_BASE_URL}?bank=${encodeURIComponent(bankInfo.bankName)}&acc=${bankInfo.accountNumber}&template=compact&amount=${sepayAmount}&des=${description}`;
                        payment.qrCode = qrCodeUrl;
                        response.qrCode = qrCodeUrl;
                    }
                    // Gia hạn lâu hơn cho chuyển khoản
                    payment.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    response.instructions = payment.instructions;
                    break;
                }
                case PaymentModel_1.PaymentMethod.WALLET: {
                    // Check wallet balance
                    const { WalletBalanceModel } = await Promise.resolve().then(() => __importStar(require("../../models/WalletModel")));
                    const wallet = await WalletBalanceModel.findOne({ userId });
                    if (!wallet || wallet.balance < payment.amount) {
                        return {
                            ok: false,
                            status: 400,
                            message: `Số dư ví không đủ. Số dư hiện tại: ${(wallet?.balance || 0).toLocaleString('vi-VN')} VNĐ. Vui lòng nạp thêm tiền.`,
                        };
                    }
                    // Deduct from wallet
                    wallet.balance -= payment.amount;
                    wallet.lastTransactionAt = new Date();
                    await wallet.save();
                    // Create wallet transaction
                    const { WalletTransactionModel, WalletTransactionType, WalletTransactionStatus } = await Promise.resolve().then(() => __importStar(require("../../models/WalletModel")));
                    await WalletTransactionModel.create({
                        userId,
                        type: WalletTransactionType.PAYMENT,
                        amount: payment.amount,
                        status: WalletTransactionStatus.COMPLETED,
                        description: `Thanh toán đơn hàng #${order._id.toString()}`,
                        orderId: order._id,
                        paymentId: payment._id,
                        completedAt: new Date(),
                    });
                    // Complete payment
                    payment.status = PaymentModel_1.PaymentStatus.COMPLETED;
                    payment.paidAt = new Date();
                    payment.transactionId = `WALLET_${payment._id.toString()}`;
                    payment.instructions = `Đã thanh toán thành công bằng ví. Số dư còn lại: ${wallet.balance.toLocaleString('vi-VN')} VNĐ`;
                    response.instructions = payment.instructions;
                    // Update order
                    await OrderModel_1.default.findByIdAndUpdate(order._id, {
                        isPay: true,
                        status: OrderModel_1.OrderStatus.PROCESSING,
                    });
                    // Note: Money will be transferred to shop wallet when order status = DELIVERED
                    break;
                }
                default: {
                    response.paymentUrl = payment.returnUrl || defaultReturnUrl;
                    break;
                }
            }
            await payment.save();
            return {
                ok: true,
                checkout: response,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to create checkout",
            };
        }
    }
    /**
     * Get payment status
     */
    static async getPaymentStatus(req, orderId) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const payment = await PaymentModel_1.default.findOne({
                orderId: orderId,
                userId: userId,
            });
            if (!payment) {
                return {
                    ok: false,
                    status: 404,
                    message: "Payment not found",
                };
            }
            // Convert to object and ensure orderId is a string, not an object
            const paymentObj = payment.toObject();
            // Ensure orderId is always a string (in case it was populated)
            if (paymentObj.orderId && typeof paymentObj.orderId === "object") {
                paymentObj.orderId =
                    paymentObj.orderId._id?.toString() || paymentObj.orderId.toString();
            }
            return {
                ok: true,
                payment: paymentObj,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to get payment status",
            };
        }
    }
    /**
     * Get payment history
     */
    static async getPaymentHistory(req, query) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const skip = (page - 1) * limit;
            // Build filter
            const filter = { userId: userId };
            if (query.status) {
                filter.status = query.status;
            }
            if (query.method) {
                filter.method = query.method;
            }
            if (query.dateFrom || query.dateTo) {
                filter.createdAt = {};
                if (query.dateFrom) {
                    filter.createdAt.$gte = new Date(query.dateFrom);
                }
                if (query.dateTo) {
                    filter.createdAt.$lte = new Date(query.dateTo);
                }
            }
            // Build sort
            const sort = {};
            if (query.sortBy) {
                sort[query.sortBy] = query.sortOrder === "desc" ? -1 : 1;
            }
            else {
                sort.createdAt = -1; // Default: newest first
            }
            const [payments, total] = await Promise.all([
                PaymentModel_1.default.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .populate("orderId")
                    .lean(),
                PaymentModel_1.default.countDocuments(filter),
            ]);
            return {
                ok: true,
                payments,
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to get payment history",
            };
        }
    }
    /**
     * Confirm bank transfer payment manually (admin or user with proof)
     */
    static async confirmBankTransfer(req, paymentId, transactionId) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const payment = await PaymentModel_1.default.findOne({
                _id: paymentId,
                userId: userId,
                method: PaymentModel_1.PaymentMethod.BANK_TRANSFER,
                status: PaymentModel_1.PaymentStatus.PENDING,
            });
            if (!payment) {
                return {
                    ok: false,
                    status: 404,
                    message: "Payment not found or already processed",
                };
            }
            // Update payment status
            payment.status = PaymentModel_1.PaymentStatus.COMPLETED;
            payment.transactionId = transactionId || `BANK_${Date.now()}`;
            payment.paidAt = new Date();
            payment.gatewayResponse = {
                confirmedBy: userId,
                confirmedAt: new Date().toISOString(),
                manualConfirmation: true,
            };
            await payment.save();
            // Update order
            const updatedOrder = await OrderModel_1.default.findByIdAndUpdate(payment.orderId, {
                isPay: true,
                status: OrderModel_1.OrderStatus.PROCESSING,
            }, { new: true });
            // Gửi thông báo cho người dùng khi thanh toán chuyển khoản được xác nhận
            if (updatedOrder) {
                await notification_service_1.notificationService.notifyUserOrderStatus({
                    userId: updatedOrder.userId.toString(),
                    orderId: updatedOrder._id.toString(),
                    status: updatedOrder.status,
                    shopName: undefined,
                });
            }
            // Note: Money will be transferred to shop wallet when order status = DELIVERED
            return {
                ok: true,
                payment: payment.toObject(),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to confirm payment",
            };
        }
    }
    /**
     * Xác nhận thanh toán chuyển khoản cho đơn hàng thông qua webhook (Sepay)
     * - Không yêu cầu request/auth
     * - Được gọi từ wallet/webhook.controller khi nhận được webhook có nội dung "Thanh toan don hang {orderId}"
     */
    static async confirmBankTransferFromWebhook(orderId, transactionId, amount) {
        try {
            const payment = await PaymentModel_1.default.findOne({
                orderId,
                method: PaymentModel_1.PaymentMethod.BANK_TRANSFER,
            }).sort({ createdAt: -1 });
            if (!payment) {
                return {
                    ok: false,
                    status: 404,
                    message: "Payment not found for this order",
                };
            }
            // Nếu đã hoàn thành thì bỏ qua (idempotent)
            if (payment.status === PaymentModel_1.PaymentStatus.COMPLETED) {
                return { ok: true, payment: payment.toObject() };
            }
            if (payment.status !== PaymentModel_1.PaymentStatus.PENDING && payment.status !== PaymentModel_1.PaymentStatus.PROCESSING) {
                return {
                    ok: false,
                    status: 400,
                    message: "Payment is not in a confirmable state",
                };
            }
            // Verify amount (cho phép lệch 1.000 VNĐ do test mode / làm tròn)
            const expectedAmount = payment.amount;
            if (Math.abs(expectedAmount - amount) > 1000) {
                return {
                    ok: false,
                    status: 400,
                    message: "Amount mismatch for bank transfer payment",
                };
            }
            payment.status = PaymentModel_1.PaymentStatus.COMPLETED;
            payment.transactionId = transactionId;
            payment.paidAt = new Date();
            payment.gatewayResponse = {
                ...(payment.gatewayResponse || {}),
                webhookConfirmed: true,
                webhookSource: "sepay",
                webhookConfirmedAt: new Date().toISOString(),
            };
            await payment.save();
            // Update order
            const updatedOrder = await OrderModel_1.default.findByIdAndUpdate(payment.orderId, {
                isPay: true,
                status: OrderModel_1.OrderStatus.PROCESSING,
            }, { new: true });
            if (updatedOrder) {
                // Gửi thông báo cho user về cập nhật trạng thái đơn
                await notification_service_1.notificationService.notifyUserOrderStatus({
                    userId: updatedOrder.userId.toString(),
                    orderId: updatedOrder._id.toString(),
                    status: updatedOrder.status,
                    shopName: undefined,
                });
            }
            return {
                ok: true,
                payment: payment.toObject(),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to confirm bank transfer from webhook",
            };
        }
    }
    static getClientIp(req) {
        const forwarded = req.headers["x-forwarded-for"];
        if (typeof forwarded === "string" && forwarded.length > 0) {
            return forwarded.split(",")[0].trim();
        }
        if (Array.isArray(forwarded) && forwarded.length > 0) {
            return forwarded[0];
        }
        const remote = (req.socket && req.socket.remoteAddress) ||
            req.ip ||
            "127.0.0.1";
        return remote.replace(/^::ffff:/, "");
    }
    static buildReturnUrl(orderId) {
        const base = CLIENT_APP_URL.endsWith("/")
            ? CLIENT_APP_URL.slice(0, -1)
            : CLIENT_APP_URL;
        return `${base}/payment/${orderId}`;
    }
    static buildCancelUrl(orderId) {
        const base = CLIENT_APP_URL.endsWith("/")
            ? CLIENT_APP_URL.slice(0, -1)
            : CLIENT_APP_URL;
        return `${base}/orders/${orderId}`;
    }
    static buildBankTransferInstructions(orderId, bankAccounts) {
        if (!bankAccounts.length) {
            return `Vui lòng liên hệ cửa hàng để được cung cấp thông tin chuyển khoản.\nNội dung chuyển khoản: ${orderId}`;
        }
        const accountLines = bankAccounts
            .map((acc) => `• ${acc.bankName}: ${acc.accountNumber} - ${acc.accountHolder}`)
            .join("\n");
        return [
            "Vui lòng chuyển khoản theo thông tin bên dưới:",
            accountLines,
            `Nội dung chuyển khoản: ${orderId}`,
            "Sau khi chuyển khoản, vui lòng xác nhận với shop để đơn hàng được xử lý.",
        ].join("\n");
    }
}
exports.default = PaymentService;
