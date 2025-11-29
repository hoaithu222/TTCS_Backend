import OrderModel from "../../models/OrderModel";
import {
  WalletBalanceModel,
  WalletTransactionModel,
  WalletTransactionType,
  WalletTransactionStatus,
} from "../../models/WalletModel";
import mongoose from "mongoose";

/**
 * Helper service for wallet operations
 */
export default class WalletHelperService {
  /**
   * Transfer money to shop owner wallet (gộp ví user + shop)
   * This is called when order status changes to DELIVERED
   */
  static async transferToShopWallet(
    orderId: string,
    amount: number,
    paymentId?: string
  ) {
    try {
      // Get order to find shop owner
      const order = await OrderModel.findById(orderId);
      if (!order || !order.shopId) {
        return {
          ok: false as const,
          message: "Order or shop not found",
        };
      }

      // Check if already transferred
      if (order.walletTransferred) {
        return {
          ok: true as const,
          message: "Money already transferred to shop wallet",
        };
      }

      // Lấy userId của chủ shop
      const ShopModel = (await import("../../models/ShopModel")).default;
      const shop = await ShopModel.findById(order.shopId).lean();
      if (!shop || !shop.userId) {
        return {
          ok: false as const,
          message: "Shop owner not found",
        };
      }

      const ownerUserId = shop.userId.toString();

      if (!mongoose.Types.ObjectId.isValid(ownerUserId)) {
        return {
          ok: false as const,
          message: "Invalid shop owner ID",
        };
      }

      // Get or create owner wallet using findOneAndUpdate to avoid race conditions
      const ownerWallet = await WalletBalanceModel.findOneAndUpdate(
        { userId: ownerUserId },
        { $setOnInsert: { balance: 0 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Add to owner wallet
      ownerWallet.balance += amount;
      ownerWallet.lastTransactionAt = new Date();
      await ownerWallet.save();

      // Create revenue transaction for owner
      const paymentObjectId = paymentId && mongoose.Types.ObjectId.isValid(paymentId)
        ? new mongoose.Types.ObjectId(paymentId)
        : undefined;
      
      await WalletTransactionModel.create({
        userId: ownerUserId,
        type: WalletTransactionType.REVENUE,
        amount: amount,
        status: WalletTransactionStatus.COMPLETED,
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
        ok: true as const,
        message: "Money transferred to shop owner wallet",
        shopWallet: ownerWallet.toObject(),
      };
    } catch (error: any) {
      return {
        ok: false as const,
        message: error.message || "Failed to transfer to shop wallet",
      };
    }
  }

  /**
   * Refund money to user wallet and deduct from shop wallet
   * This is called when order is cancelled or returned
   */
  static async refundOrder(
    orderId: string,
    reason?: string
  ) {
    try {
      // Get order
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return {
          ok: false as const,
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
        const ShopModel = (await import("../../models/ShopModel")).default;
        const shop = await ShopModel.findById(shopId).lean();
        if (shop?.userId) {
          const ownerUserId = shop.userId.toString();
          const ownerWallet = await WalletBalanceModel.findOne({ userId: ownerUserId });
          if (ownerWallet && ownerWallet.balance >= amount) {
            ownerWallet.balance -= amount;
            ownerWallet.lastTransactionAt = new Date();
            await ownerWallet.save();

            await WalletTransactionModel.create({
              userId: ownerUserId,
              type: WalletTransactionType.REFUND,
              amount: -amount,
              status: WalletTransactionStatus.COMPLETED,
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
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
          return {
            ok: false as const,
            message: "Invalid user ID",
          };
        }

        // Get or create user wallet using findOneAndUpdate to avoid race conditions
        const userWallet = await WalletBalanceModel.findOneAndUpdate(
          { userId },
          { $setOnInsert: { balance: 0 } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Add to user wallet
        userWallet.balance += amount;
        userWallet.lastTransactionAt = new Date();
        await userWallet.save();

        // Create refund transaction for user
        await WalletTransactionModel.create({
          userId,
          type: WalletTransactionType.REFUND,
          amount: amount,
          status: WalletTransactionStatus.COMPLETED,
          description: reason || `Hoàn tiền đơn hàng #${orderId}`,
          orderId: order._id,
          completedAt: new Date(),
        });
      }

      // Mark order as refunded
      order.walletTransferred = false;
      await order.save();

      return {
        ok: true as const,
        message: "Order refunded successfully",
      };
    } catch (error: any) {
      return {
        ok: false as const,
        message: error.message || "Failed to refund order",
      };
    }
  }

  /**
   * Deduct from shop wallet (for withdrawal or refund)
   */
  static async deductFromShopWallet(
    shopId: string,
    amount: number,
    description: string
  ) {
    try {
      const shopWallet = await WalletBalanceModel.findOne({ shopId });
      if (!shopWallet) {
        return {
          ok: false as const,
          message: "Shop wallet not found",
        };
      }

      if (shopWallet.balance < amount) {
        return {
          ok: false as const,
          message: "Insufficient balance",
        };
      }

      shopWallet.balance -= amount;
      shopWallet.lastTransactionAt = new Date();
      await shopWallet.save();

      // Create transaction
      await WalletTransactionModel.create({
        shopId,
        type: WalletTransactionType.WITHDRAW,
        amount: amount,
        status: WalletTransactionStatus.COMPLETED,
        description: description,
        completedAt: new Date(),
      });

      return {
        ok: true as const,
        message: "Amount deducted from shop wallet",
        shopWallet: shopWallet.toObject(),
      };
    } catch (error: any) {
      return {
        ok: false as const,
        message: error.message || "Failed to deduct from shop wallet",
      };
    }
  }
}

