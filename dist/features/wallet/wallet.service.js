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
     * Get wallet balance (for user or shop)
     * If user is shop owner, returns both user and shop wallets
     */
    static async getBalance(req) {
        try {
            const userId = req.user?.userId;
            const shopId = req.shopId || req.query.shopId; // Support shop wallet query
            // Validate userId if provided - must be a valid ObjectId string
            if (userId && (!mongoose_1.default.Types.ObjectId.isValid(userId) || userId === 'null' || userId === 'undefined')) {
                return { ok: false, status: 401, message: "Invalid user ID" };
            }
            // Validate shopId if provided
            if (shopId && (!mongoose_1.default.Types.ObjectId.isValid(shopId) || shopId === 'null' || shopId === 'undefined')) {
                return { ok: false, status: 400, message: "Invalid shop ID" };
            }
            if (!userId && !shopId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            // If shopId is provided, return shop wallet only
            if (shopId) {
                // Use findOneAndUpdate with upsert to avoid race conditions
                const wallet = await WalletModel_1.WalletBalanceModel.findOneAndUpdate({ shopId }, { $setOnInsert: { balance: 0 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
                return {
                    ok: true,
                    balance: wallet.balance,
                    wallet: wallet.toObject(),
                };
            }
            // Ensure userId is valid before proceeding
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                return { ok: false, status: 401, message: "Invalid or missing user ID" };
            }
            // Get user wallet using findOneAndUpdate to avoid race conditions
            const userWallet = await WalletModel_1.WalletBalanceModel.findOneAndUpdate({ userId }, { $setOnInsert: { balance: 0 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
            // Check if user is shop owner
            const ShopModel = (await Promise.resolve().then(() => __importStar(require("../../models/ShopModel")))).default;
            const shop = await ShopModel.findOne({ userId }).lean();
            let shopWallet = null;
            if (shop && shop._id) {
                // Use findOneAndUpdate with upsert to avoid race conditions
                shopWallet = await WalletModel_1.WalletBalanceModel.findOneAndUpdate({ shopId: shop._id }, { $setOnInsert: { balance: 0 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
            }
            return {
                ok: true,
                balance: userWallet.balance,
                wallet: userWallet.toObject(),
                shopWallet: shopWallet ? shopWallet.toObject() : null,
                shop: shop ? { _id: shop._id, name: shop.name } : null,
            };
        }
        catch (error) {
            // Handle duplicate key errors specifically
            if (error.code === 11000 || error.message?.includes('duplicate key')) {
                // Retry once if duplicate key error (race condition)
                try {
                    const userId = req.user?.userId;
                    const shopId = req.shopId || req.query.shopId;
                    if (shopId) {
                        const wallet = await WalletModel_1.WalletBalanceModel.findOne({ shopId });
                        if (wallet) {
                            return {
                                ok: true,
                                balance: wallet.balance,
                                wallet: wallet.toObject(),
                            };
                        }
                    }
                    if (userId) {
                        const userWallet = await WalletModel_1.WalletBalanceModel.findOne({ userId });
                        if (userWallet) {
                            const ShopModel = (await Promise.resolve().then(() => __importStar(require("../../models/ShopModel")))).default;
                            const shop = await ShopModel.findOne({ userId }).lean();
                            let shopWallet = null;
                            if (shop && shop._id) {
                                shopWallet = await WalletModel_1.WalletBalanceModel.findOne({ shopId: shop._id });
                            }
                            return {
                                ok: true,
                                balance: userWallet.balance,
                                wallet: userWallet.toObject(),
                                shopWallet: shopWallet ? shopWallet.toObject() : null,
                                shop: shop ? { _id: shop._id, name: shop.name } : null,
                            };
                        }
                    }
                }
                catch (retryError) {
                    // If retry also fails, return error
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
            // Get or create wallet
            let wallet = await WalletModel_1.WalletBalanceModel.findOne({ userId });
            if (!wallet) {
                wallet = await WalletModel_1.WalletBalanceModel.create({
                    userId,
                    balance: 0,
                });
            }
            // Determine wallet type (user or shop)
            const walletType = req.query.walletType || "user";
            let shopId = undefined;
            let targetWallet = null;
            if (walletType === "shop") {
                const ShopModel = (await Promise.resolve().then(() => __importStar(require("../../models/ShopModel")))).default;
                const shop = await ShopModel.findOne({ userId });
                if (!shop) {
                    return {
                        ok: false,
                        status: 404,
                        message: "Shop not found",
                    };
                }
                shopId = shop._id;
                targetWallet = await WalletModel_1.WalletBalanceModel.findOne({ shopId });
            }
            else {
                targetWallet = await WalletModel_1.WalletBalanceModel.findOne({ userId });
            }
            // Get bank account info from user's wallet, fallback to default
            let bankAccountInfo = BANK_ACCOUNT;
            if (targetWallet?.bankInfo) {
                bankAccountInfo = {
                    bankName: targetWallet.bankInfo.bankName,
                    accountNumber: targetWallet.bankInfo.accountNumber,
                    accountHolder: targetWallet.bankInfo.accountHolder,
                };
            }
            // Áp dụng số tiền thực tế sử dụng cho QR (giới hạn khi test)
            const sepayAmount = getSepayAmount(data.amount);
            // Create deposit transaction
            const transaction = await WalletModel_1.WalletTransactionModel.create({
                userId: walletType === "user" ? userId : undefined,
                shopId: walletType === "shop" ? shopId : undefined,
                type: WalletModel_1.WalletTransactionType.DEPOSIT,
                amount: sepayAmount,
                status: WalletModel_1.WalletTransactionStatus.PENDING,
                description: data.description ||
                    `Nạp tiền vào ví ${walletType === "shop" ? "shop" : "cá nhân"} - ${sepayAmount.toLocaleString("vi-VN")} VNĐ`,
                bankAccount: bankAccountInfo,
                metadata: {
                    walletType,
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
            instructions = `Quét mã QR để nạp ${sepayAmount.toLocaleString("vi-VN")} VNĐ vào ví của bạn.\nNgân hàng: ${bankAccountInfo.bankName}\nSố tài khoản: ${bankAccountInfo.accountNumber}\nChủ tài khoản: ${bankAccountInfo.accountHolder}\nNội dung chuyển khoản: Nap tien ${transaction._id.toString()}\n\nSau khi thanh toán thành công qua Sepay, hệ thống sẽ tự động cập nhật số dư ví (thường trong vài phút).`;
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
            const shopId = query.shopId || req.shopId;
            if (!userId && !shopId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const skip = (page - 1) * limit;
            const filter = shopId ? { shopId } : { userId };
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
            if (Math.abs(transaction.amount - amount) > 1000) {
                // Allow 1000 VNĐ difference for rounding
                return {
                    ok: false,
                    status: 400,
                    message: "Amount mismatch",
                };
            }
            // Update transaction
            transaction.status = WalletModel_1.WalletTransactionStatus.COMPLETED;
            transaction.transactionId = bankTransactionId;
            transaction.completedAt = new Date();
            await transaction.save();
            // Update wallet balance (support both user and shop)
            let wallet;
            if (transaction.userId) {
                wallet = await WalletModel_1.WalletBalanceModel.findOne({
                    userId: transaction.userId,
                });
                if (wallet) {
                    wallet.balance += transaction.amount;
                    wallet.lastTransactionAt = new Date();
                    await wallet.save();
                }
                else {
                    await WalletModel_1.WalletBalanceModel.create({
                        userId: transaction.userId,
                        balance: transaction.amount,
                        lastTransactionAt: new Date(),
                    });
                }
            }
            else if (transaction.shopId) {
                wallet = await WalletModel_1.WalletBalanceModel.findOne({
                    shopId: transaction.shopId,
                });
                if (wallet) {
                    wallet.balance += transaction.amount;
                    wallet.lastTransactionAt = new Date();
                    await wallet.save();
                }
                else {
                    await WalletModel_1.WalletBalanceModel.create({
                        shopId: transaction.shopId,
                        balance: transaction.amount,
                        lastTransactionAt: new Date(),
                    });
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
            // Get shop from user
            const ShopModel = (await Promise.resolve().then(() => __importStar(require("../../models/ShopModel")))).default;
            const shop = await ShopModel.findOne({ userId });
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop not found",
                };
            }
            if (!data.amount || data.amount <= 0) {
                return {
                    ok: false,
                    status: 400,
                    message: "Số tiền rút phải lớn hơn 0",
                };
            }
            // Get shop wallet
            let shopWallet = await WalletModel_1.WalletBalanceModel.findOne({ shopId: shop._id });
            if (!shopWallet) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop wallet not found",
                };
            }
            if (shopWallet.balance < data.amount) {
                return {
                    ok: false,
                    status: 400,
                    message: `Số dư không đủ. Số dư hiện tại: ${shopWallet.balance.toLocaleString('vi-VN')} VNĐ`,
                };
            }
            // Deduct from wallet
            shopWallet.balance -= data.amount;
            shopWallet.lastTransactionAt = new Date();
            await shopWallet.save();
            // Create withdrawal transaction
            const transaction = await WalletModel_1.WalletTransactionModel.create({
                shopId: shop._id,
                type: WalletModel_1.WalletTransactionType.WITHDRAW,
                amount: data.amount,
                status: WalletModel_1.WalletTransactionStatus.COMPLETED,
                description: data.description || `Rút tiền từ ví shop - ${data.amount.toLocaleString('vi-VN')} VNĐ`,
                completedAt: new Date(),
            });
            return {
                ok: true,
                transaction: transaction.toObject(),
                balance: shopWallet.balance,
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
            let wallet;
            if (data.walletType === "shop") {
                // Update shop wallet
                const ShopModel = (await Promise.resolve().then(() => __importStar(require("../../models/ShopModel")))).default;
                const shop = await ShopModel.findOne({ userId });
                if (!shop) {
                    return {
                        ok: false,
                        status: 404,
                        message: "Shop not found",
                    };
                }
                wallet = await WalletModel_1.WalletBalanceModel.findOne({ shopId: shop._id });
                if (!wallet) {
                    wallet = await WalletModel_1.WalletBalanceModel.create({
                        shopId: shop._id,
                        balance: 0,
                    });
                }
            }
            else {
                // Update user wallet
                wallet = await WalletModel_1.WalletBalanceModel.findOne({ userId });
                if (!wallet) {
                    wallet = await WalletModel_1.WalletBalanceModel.create({
                        userId,
                        balance: 0,
                    });
                }
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
            const userId = req.user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            if (data.from === data.to) {
                return {
                    ok: false,
                    status: 400,
                    message: "Cannot transfer to the same wallet",
                };
            }
            if (!data.amount || data.amount <= 0) {
                return {
                    ok: false,
                    status: 400,
                    message: "Số tiền chuyển phải lớn hơn 0",
                };
            }
            // Get shop info
            const ShopModel = (await Promise.resolve().then(() => __importStar(require("../../models/ShopModel")))).default;
            const shop = await ShopModel.findOne({ userId });
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop not found",
                };
            }
            // Get both wallets
            let userWallet = await WalletModel_1.WalletBalanceModel.findOne({ userId });
            if (!userWallet) {
                userWallet = await WalletModel_1.WalletBalanceModel.create({
                    userId,
                    balance: 0,
                });
            }
            let shopWallet = await WalletModel_1.WalletBalanceModel.findOne({ shopId: shop._id });
            if (!shopWallet) {
                shopWallet = await WalletModel_1.WalletBalanceModel.create({
                    shopId: shop._id,
                    balance: 0,
                });
            }
            // Determine source and destination
            const sourceWallet = data.from === "user" ? userWallet : shopWallet;
            const destWallet = data.to === "user" ? userWallet : shopWallet;
            // Check balance
            if (sourceWallet.balance < data.amount) {
                return {
                    ok: false,
                    status: 400,
                    message: `Số dư không đủ. Số dư hiện tại: ${sourceWallet.balance.toLocaleString('vi-VN')} VNĐ`,
                };
            }
            // Transfer
            sourceWallet.balance -= data.amount;
            destWallet.balance += data.amount;
            sourceWallet.lastTransactionAt = new Date();
            destWallet.lastTransactionAt = new Date();
            await Promise.all([sourceWallet.save(), destWallet.save()]);
            // Create transactions
            const description = data.description || `Chuyển tiền từ ví ${data.from === "user" ? "cá nhân" : "shop"} sang ví ${data.to === "user" ? "cá nhân" : "shop"}`;
            await Promise.all([
                WalletModel_1.WalletTransactionModel.create({
                    userId: data.from === "user" ? userId : undefined,
                    shopId: data.from === "shop" ? shop._id : undefined,
                    type: WalletModel_1.WalletTransactionType.TRANSFER,
                    amount: data.amount,
                    status: WalletModel_1.WalletTransactionStatus.COMPLETED,
                    description: `${description} (Gửi)`,
                    completedAt: new Date(),
                }),
                WalletModel_1.WalletTransactionModel.create({
                    userId: data.to === "user" ? userId : undefined,
                    shopId: data.to === "shop" ? shop._id : undefined,
                    type: WalletModel_1.WalletTransactionType.TRANSFER,
                    amount: data.amount,
                    status: WalletModel_1.WalletTransactionStatus.COMPLETED,
                    description: `${description} (Nhận)`,
                    completedAt: new Date(),
                }),
            ]);
            return {
                ok: true,
                message: "Chuyển tiền thành công",
                userWallet: userWallet.toObject(),
                shopWallet: shopWallet.toObject(),
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
