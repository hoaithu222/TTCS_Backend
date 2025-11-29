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
const OrderModel_1 = __importDefault(require("../../models/OrderModel"));
const WalletModel_1 = require("../../models/WalletModel");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Helper service for wallet operations
 */
class WalletHelperService {
    /**
     * Transfer money to shop owner wallet (gộp ví user + shop)
     * This is called when order status changes to DELIVERED
     */
    static async transferToShopWallet(orderId, amount, paymentId) {
        try {
            // Get order to find shop owner
            const order = await OrderModel_1.default.findById(orderId);
            if (!order || !order.shopId) {
                return {
                    ok: false,
                    message: "Order or shop not found",
                };
            }
            // Check if already transferred
            if (order.walletTransferred) {
                return {
                    ok: true,
                    message: "Money already transferred to shop wallet",
                };
            }
            // Lấy userId của chủ shop
            const ShopModel = (await Promise.resolve().then(() => __importStar(require("../../models/ShopModel")))).default;
            const shop = await ShopModel.findById(order.shopId).lean();
            if (!shop || !shop.userId) {
                return {
                    ok: false,
                    message: "Shop owner not found",
                };
            }
            const ownerUserId = shop.userId.toString();
            if (!mongoose_1.default.Types.ObjectId.isValid(ownerUserId)) {
                return {
                    ok: false,
                    message: "Invalid shop owner ID",
                };
            }
            // Get or create owner wallet using findOneAndUpdate to avoid race conditions
            const ownerWallet = await WalletModel_1.WalletBalanceModel.findOneAndUpdate({ userId: ownerUserId }, { $setOnInsert: { balance: 0 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
            // Add to owner wallet
            ownerWallet.balance += amount;
            ownerWallet.lastTransactionAt = new Date();
            await ownerWallet.save();
            // Create revenue transaction for owner
            const paymentObjectId = paymentId && mongoose_1.default.Types.ObjectId.isValid(paymentId)
                ? new mongoose_1.default.Types.ObjectId(paymentId)
                : undefined;
            await WalletModel_1.WalletTransactionModel.create({
                userId: ownerUserId,
                type: WalletModel_1.WalletTransactionType.REVENUE,
                amount: amount,
                status: WalletModel_1.WalletTransactionStatus.COMPLETED,
                description: `Nhận thanh toán từ đơn hàng #${orderId} (Đã giao hàng thành công)`,
                orderId: order._id,
                paymentId: paymentObjectId,
                completedAt: new Date(),
            });
            // Mark order as wallet transferred
            order.walletTransferred = true;
            order.walletTransferredAt = new Date();
            await order.save();
            return {
                ok: true,
                message: "Money transferred to shop owner wallet",
                shopWallet: ownerWallet.toObject(),
            };
        }
        catch (error) {
            return {
                ok: false,
                message: error.message || "Failed to transfer to shop wallet",
            };
        }
    }
    /**
     * Refund money to user wallet and deduct from shop wallet
     * This is called when order is cancelled or returned
     */
    static async refundOrder(orderId, reason) {
        try {
            // Get order
            const order = await OrderModel_1.default.findById(orderId);
            if (!order) {
                return {
                    ok: false,
                    message: "Order not found",
                };
            }
            const userId = order.userId.toString();
            const shopId = order.shopId;
            const amount = order.totalAmount;
            // Check if order was already refunded (by checking if wallet was transferred)
            // If wallet was transferred, we need to deduct from shop wallet
            if (order.walletTransferred) {
                // Deduct from shop owner wallet (gộp ví)
                const ShopModel = (await Promise.resolve().then(() => __importStar(require("../../models/ShopModel")))).default;
                const shop = await ShopModel.findById(shopId).lean();
                if (shop?.userId) {
                    const ownerUserId = shop.userId.toString();
                    const ownerWallet = await WalletModel_1.WalletBalanceModel.findOne({ userId: ownerUserId });
                    if (ownerWallet && ownerWallet.balance >= amount) {
                        ownerWallet.balance -= amount;
                        ownerWallet.lastTransactionAt = new Date();
                        await ownerWallet.save();
                        await WalletModel_1.WalletTransactionModel.create({
                            userId: ownerUserId,
                            type: WalletModel_1.WalletTransactionType.REFUND,
                            amount: -amount,
                            status: WalletModel_1.WalletTransactionStatus.COMPLETED,
                            description: reason || `Hoàn tiền đơn hàng #${orderId} (Đã trừ từ ví chủ shop)`,
                            orderId: order._id,
                            completedAt: new Date(),
                        });
                    }
                }
            }
            // Refund to user wallet (only if payment was made)
            if (order.isPay) {
                // Validate userId
                if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    return {
                        ok: false,
                        message: "Invalid user ID",
                    };
                }
                // Get or create user wallet using findOneAndUpdate to avoid race conditions
                const userWallet = await WalletModel_1.WalletBalanceModel.findOneAndUpdate({ userId }, { $setOnInsert: { balance: 0 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
                // Add to user wallet
                userWallet.balance += amount;
                userWallet.lastTransactionAt = new Date();
                await userWallet.save();
                // Create refund transaction for user
                await WalletModel_1.WalletTransactionModel.create({
                    userId,
                    type: WalletModel_1.WalletTransactionType.REFUND,
                    amount: amount,
                    status: WalletModel_1.WalletTransactionStatus.COMPLETED,
                    description: reason || `Hoàn tiền đơn hàng #${orderId}`,
                    orderId: order._id,
                    completedAt: new Date(),
                });
            }
            // Mark order as refunded
            order.walletTransferred = false;
            await order.save();
            return {
                ok: true,
                message: "Order refunded successfully",
            };
        }
        catch (error) {
            return {
                ok: false,
                message: error.message || "Failed to refund order",
            };
        }
    }
    /**
     * Deduct from shop wallet (for withdrawal or refund)
     */
    static async deductFromShopWallet(shopId, amount, description) {
        try {
            const shopWallet = await WalletModel_1.WalletBalanceModel.findOne({ shopId });
            if (!shopWallet) {
                return {
                    ok: false,
                    message: "Shop wallet not found",
                };
            }
            if (shopWallet.balance < amount) {
                return {
                    ok: false,
                    message: "Insufficient balance",
                };
            }
            shopWallet.balance -= amount;
            shopWallet.lastTransactionAt = new Date();
            await shopWallet.save();
            // Create transaction
            await WalletModel_1.WalletTransactionModel.create({
                shopId,
                type: WalletModel_1.WalletTransactionType.WITHDRAW,
                amount: amount,
                status: WalletModel_1.WalletTransactionStatus.COMPLETED,
                description: description,
                completedAt: new Date(),
            });
            return {
                ok: true,
                message: "Amount deducted from shop wallet",
                shopWallet: shopWallet.toObject(),
            };
        }
        catch (error) {
            return {
                ok: false,
                message: error.message || "Failed to deduct from shop wallet",
            };
        }
    }
}
exports.default = WalletHelperService;
