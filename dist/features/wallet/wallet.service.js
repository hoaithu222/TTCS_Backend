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
const WalletModel_1 = require("../../models/WalletModel");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Get client IP address from request
 */
function getClientIp(req) {
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
const BANK_ACCOUNT = {
    bankName: process.env.BANK_NAME || "MBBank",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "0982512466",
    accountHolder: process.env.BANK_ACCOUNT_HOLDER || "Công ty TNHH ABC",
};
// QR Code generation options
const QR_CODE_BASE_URL = "https://qr.sepay.vn/img";
const USE_VNPAY_QR = false; // Luồng nạp ví dùng QR Sepay, không dùng VNPay trực tiếp
// Sepay test mode: giới hạn số tiền thực chuyển để test
const SEPAY_TEST_MODE = process.env.SEPAY_TEST_MODE === "true" || process.env.NODE_ENV !== "production";
const SEPAY_TEST_MAX_AMOUNT = Number.parseInt(process.env.SEPAY_TEST_MAX_AMOUNT || "9000", 10) || 9000;
const getSepayAmount = (originalAmount) => {
    if (!SEPAY_TEST_MODE)
        return originalAmount;
    return Math.max(1000, Math.min(originalAmount, SEPAY_TEST_MAX_AMOUNT));
};
class WalletService {
    /**
     * Get wallet balance (gộp ví user + shop thành một ví duy nhất theo userId)
     */
    static async getBalance(req) {
        try {
            const userId = req.user?.userId;
            // Validate userId
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            // Get user wallet using findOneAndUpdate to avoid race conditions
            const userWallet = await WalletModel_1.WalletBalanceModel.findOneAndUpdate({ userId }, { $setOnInsert: { balance: 0 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
            return {
                ok: true,
                balance: userWallet.balance,
                wallet: userWallet.toObject(),
                // Gộp ví: không trả về ví shop riêng nữa
                shopWallet: null,
                shop: null,
            };
        }
        catch (error) {
            // Handle duplicate key errors specifically
            if (error.code === 11000 || error.message?.includes('duplicate key')) {
                // Retry once nếu bị race condition
                try {
                    const userId = req.user?.userId;
                    if (userId) {
                        const userWallet = await WalletModel_1.WalletBalanceModel.findOne({ userId });
                        if (userWallet) {
                            return {
                                ok: true,
                                balance: userWallet.balance,
                                wallet: userWallet.toObject(),
                                shopWallet: null,
                                shop: null,
                            };
                        }
                    }
                }
                catch (retryError) {
                    // ignore
                }
            }
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to get wallet balance",
            };
        }
    }
    /**
     * Create deposit request (nạp tiền)
     */
    static async createDeposit(req, data) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            if (!data.amount || data.amount <= 0) {
                return {
                    ok: false,
                    status: 400,
                    message: "Số tiền nạp phải lớn hơn 0",
                };
            }
            // Get or create ví (gộp: dùng userId làm mã ví duy nhất)
            let wallet = await WalletModel_1.WalletBalanceModel.findOne({ userId });
            if (!wallet) {
                wallet = await WalletModel_1.WalletBalanceModel.create({
                    userId,
                    balance: 0,
                });
            }
            // Chỉ dùng một ví duy nhất: lấy bankInfo từ ví user, fallback BANK_ACCOUNT
            const targetWallet = wallet;
            // Ưu tiên bankInfo đã lưu trong ví nếu đầy đủ, nếu không dùng BANK_ACCOUNT từ env
            let bankAccountInfo = BANK_ACCOUNT;
            const walletBank = targetWallet?.bankInfo;
            if (walletBank &&
                walletBank.bankName &&
                walletBank.accountNumber &&
                walletBank.accountHolder) {
                bankAccountInfo = {
                    bankName: walletBank.bankName,
                    accountNumber: walletBank.accountNumber,
                    accountHolder: walletBank.accountHolder,
                };
            }
            // Áp dụng số tiền thực tế sử dụng cho QR (giới hạn khi test)
            const sepayAmount = getSepayAmount(data.amount);
            // Create deposit transaction (gắn với userId)
            const transaction = await WalletModel_1.WalletTransactionModel.create({
                userId,
                type: WalletModel_1.WalletTransactionType.DEPOSIT,
                amount: sepayAmount,
                status: WalletModel_1.WalletTransactionStatus.PENDING,
                description: data.description ||
                    `Nạp tiền vào ví - ${sepayAmount.toLocaleString("vi-VN")} VNĐ`,
                bankAccount: bankAccountInfo,
                metadata: {
                    originalAmount: data.amount,
                },
            });
            let qrCodeUrl;
            let paymentUrl;
            let expiresAt;
            // Với yêu cầu chỉ dùng Sepay, luôn sử dụng QR Sepay (bank) cho nạp ví
            const depositMethod = "bank";
            // Sử dụng QR Sepay (VietQR) với thông tin ngân hàng đã cấu hình
            const description = encodeURIComponent(`Nap tien ${transaction._id.toString()}`);
            qrCodeUrl = `${QR_CODE_BASE_URL}?bank=${encodeURIComponent(bankAccountInfo.bankName)}&acc=${bankAccountInfo.accountNumber}&template=compact&amount=${sepayAmount}&des=${description}`;
            transaction.qrCode = qrCodeUrl;
            await transaction.save();
            // Generate instructions based on deposit method
            let instructions;
            instructions = `Quét mã QR hoặc chuyển khoản theo thông tin bên dưới để nạp tiền vào ví của bạn.\nNgân hàng: ${bankAccountInfo.bankName}\nSố tài khoản: ${bankAccountInfo.accountNumber}\nChủ tài khoản: ${bankAccountInfo.accountHolder}\nNội dung chuyển khoản: Nap tien ${transaction._id.toString()}\n\nSau khi thanh toán thành công qua Sepay, hệ thống sẽ tự động cập nhật số dư ví (thường trong vài phút).`;
            return {
                ok: true,
                transaction: transaction.toObject(),
                qrCode: qrCodeUrl,
                paymentUrl: paymentUrl, // VNPay payment URL if enabled
                expiresAt: expiresAt?.toISOString(), // QR expiration time
                bankAccount: bankAccountInfo,
                instructions,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to create deposit",
            };
        }
    }
    /**
     * Get wallet transactions history (for user or shop)
     */
    static async getTransactions(req, query) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const skip = (page - 1) * limit;
            // Gộp ví: chỉ lọc theo userId (bao gồm cả giao dịch doanh thu REVENUE, thanh toán, nạp/rút)
            const filter = { userId };
            if (query.type) {
                filter.type = query.type;
            }
            if (query.status) {
                filter.status = query.status;
            }
            const [transactions, total] = await Promise.all([
                WalletModel_1.WalletTransactionModel.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                WalletModel_1.WalletTransactionModel.countDocuments(filter),
            ]);
            return {
                ok: true,
                transactions,
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
                message: error.message || "Failed to get transactions",
            };
        }
    }
    /**
     * Confirm deposit from webhook (VNPay, bank transfer, or test)
     */
    static async confirmDeposit(transactionId, bankTransactionId, amount, source = "bank") {
        try {
            const transaction = await WalletModel_1.WalletTransactionModel.findById(transactionId);
            if (!transaction) {
                return {
                    ok: false,
                    status: 404,
                    message: "Transaction not found",
                };
            }
            if (transaction.status === WalletModel_1.WalletTransactionStatus.COMPLETED) {
                return {
                    ok: false,
                    status: 400,
                    message: "Transaction already completed",
                };
            }
            // Verify amount
            // Nếu có metadata.originalAmount (transaction mới), transaction.amount đã là sepayAmount
            // Nếu không có (transaction cũ), transaction.amount là số tiền gốc, cần tính lại sepayAmount để so sánh
            let expectedAmount = transaction.amount;
            const originalAmount = transaction.metadata?.originalAmount;
            if (!originalAmount && SEPAY_TEST_MODE && transaction.amount > SEPAY_TEST_MAX_AMOUNT) {
                // Transaction cũ: tính lại sepayAmount từ số tiền gốc
                expectedAmount = getSepayAmount(transaction.amount);
            }
            if (Math.abs(expectedAmount - amount) > 1000) {
                // Allow 1000 VNĐ difference for rounding/test mode
                return {
                    ok: false,
                    status: 400,
                    message: `Amount mismatch: expected ${expectedAmount} (original: ${originalAmount || transaction.amount}), received ${amount}`,
                };
            }
            // Update transaction
            transaction.status = WalletModel_1.WalletTransactionStatus.COMPLETED;
            transaction.transactionId = bankTransactionId;
            transaction.completedAt = new Date();
            await transaction.save();
            // Update wallet balance (gộp ví: luôn cộng vào ví theo userId)
            // Nếu có metadata.originalAmount, cộng số tiền gốc; nếu không, cộng transaction.amount
            if (transaction.userId) {
                let wallet = await WalletModel_1.WalletBalanceModel.findOne({
                    userId: transaction.userId,
                });
                if (!wallet) {
                    wallet = await WalletModel_1.WalletBalanceModel.create({
                        userId: transaction.userId,
                        balance: 0,
                    });
                }
                // Cộng số tiền gốc nếu có, nếu không cộng transaction.amount (đã là sepayAmount)
                const amountToAdd = transaction.metadata?.originalAmount || transaction.amount;
                wallet.balance += amountToAdd;
                wallet.lastTransactionAt = new Date();
                await wallet.save();
                // Gửi notification cho user khi nạp tiền thành công
                try {
                    const { notificationService } = await Promise.resolve().then(() => __importStar(require("../../shared/services/notification.service")));
                    await notificationService.createAndEmit({
                        userId: transaction.userId.toString(),
                        title: "Nạp tiền thành công",
                        content: `Bạn đã nạp ${amountToAdd.toLocaleString("vi-VN")} VNĐ vào ví. Số dư hiện tại: ${wallet.balance.toLocaleString("vi-VN")} VNĐ`,
                        type: "wallet:deposit:success",
                        icon: "wallet",
                        actionUrl: `/profile?tab=wallet`,
                        metadata: {
                            transactionId: transaction._id.toString(),
                            amount: amountToAdd,
                            balance: wallet.balance,
                        },
                        priority: "high",
                    });
                }
                catch (error) {
                    console.error("[WalletService] Failed to send deposit notification:", error);
                }
            }
            return {
                ok: true,
                transaction: transaction.toObject(),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to confirm deposit",
            };
        }
    }
    /**
     * Withdraw money from shop wallet
     */
    static async withdrawFromShop(req, data) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            if (!data.amount || data.amount <= 0) {
                return {
                    ok: false,
                    status: 400,
                    message: "Số tiền rút phải lớn hơn 0",
                };
            }
            // Gộp ví: rút tiền từ ví user (chung với ví shop)
            let wallet = await WalletModel_1.WalletBalanceModel.findOne({ userId });
            if (!wallet) {
                return {
                    ok: false,
                    status: 404,
                    message: "Wallet not found",
                };
            }
            if (wallet.balance < data.amount) {
                return {
                    ok: false,
                    status: 400,
                    message: `Số dư không đủ. Số dư hiện tại: ${wallet.balance.toLocaleString('vi-VN')} VNĐ`,
                };
            }
            wallet.balance -= data.amount;
            wallet.lastTransactionAt = new Date();
            await wallet.save();
            const transaction = await WalletModel_1.WalletTransactionModel.create({
                userId,
                type: WalletModel_1.WalletTransactionType.WITHDRAW,
                amount: data.amount,
                status: WalletModel_1.WalletTransactionStatus.COMPLETED,
                description: data.description || `Rút tiền từ ví - ${data.amount.toLocaleString('vi-VN')} VNĐ`,
                completedAt: new Date(),
            });
            return {
                ok: true,
                transaction: transaction.toObject(),
                balance: wallet.balance,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to withdraw from shop wallet",
            };
        }
    }
    /**
     * Update bank information for wallet
     */
    static async updateBankInfo(req, data) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            // Gộp ví: luôn cập nhật bankInfo cho ví theo userId
            let wallet = await WalletModel_1.WalletBalanceModel.findOne({ userId });
            if (!wallet) {
                wallet = await WalletModel_1.WalletBalanceModel.create({
                    userId,
                    balance: 0,
                });
            }
            wallet.bankInfo = {
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                accountHolder: data.accountHolder,
            };
            wallet.isVerified = true;
            wallet.verifiedAt = new Date();
            await wallet.save();
            return {
                ok: true,
                wallet: wallet.toObject(),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to update bank info",
            };
        }
    }
    /**
     * Transfer money between user and shop wallets
     */
    static async transferBetweenWallets(req, data) {
        try {
            // Ví đã gộp giữa user và shop, không còn hỗ trợ chuyển giữa 2 ví
            return {
                ok: false,
                status: 400,
                message: "Ví user và ví shop đã gộp chung, không cần chuyển giữa các ví",
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to transfer between wallets",
            };
        }
    }
    /**
     * Admin: Update transaction status manually
     */
    static async updateTransactionStatus(req, transactionId, data) {
        try {
            const transaction = await WalletModel_1.WalletTransactionModel.findById(transactionId);
            if (!transaction) {
                return {
                    ok: false,
                    status: 404,
                    message: "Transaction not found",
                };
            }
            const oldStatus = transaction.status;
            transaction.status = data.status;
            if (data.status === WalletModel_1.WalletTransactionStatus.COMPLETED && oldStatus !== WalletModel_1.WalletTransactionStatus.COMPLETED) {
                // If marking as completed, confirm the deposit
                if (transaction.type === WalletModel_1.WalletTransactionType.DEPOSIT) {
                    const result = await WalletService.confirmDeposit(transactionId, `ADMIN_${Date.now()}`, transaction.amount, "admin");
                    if (!result.ok) {
                        return result;
                    }
                }
            }
            transaction.metadata = {
                ...transaction.metadata,
                adminUpdated: true,
                adminUpdatedAt: new Date().toISOString(),
                adminNotes: data.notes,
            };
            await transaction.save();
            return {
                ok: true,
                transaction: transaction.toObject(),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message || "Failed to update transaction status",
            };
        }
    }
    /**
     * Admin: Get all pending transactions
     */
    static async getPendingTransactions(req, query) {
        try {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const skip = (page - 1) * limit;
            const filter = {
                status: WalletModel_1.WalletTransactionStatus.PENDING,
            };
            if (query.type) {
                filter.type = query.type;
            }
            const [transactions, total] = await Promise.all([
                WalletModel_1.WalletTransactionModel.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                WalletModel_1.WalletTransactionModel.countDocuments(filter),
            ]);
            return {
                ok: true,
                transactions,
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
                message: error.message || "Failed to get pending transactions",
            };
        }
    }
}
exports.default = WalletService;
