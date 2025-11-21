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
   * Transfer money to shop wallet when order is delivered
   * This is called when order status changes to DELIVERED
   */
  static async transferToShopWallet(
    orderId: string,
    amount: number,
    paymentId?: string
  ) {
    try {
      // Get order to find shopId
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

      const shopId = order.shopId;

      // Validate shopId
      if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
        return {
          ok: false as const,
          message: "Invalid shop ID",
        };
      }

      // Get or create shop wallet using findOneAndUpdate to avoid race conditions
      const shopWallet = await WalletBalanceModel.findOneAndUpdate(
        { shopId },
        { $setOnInsert: { balance: 0 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Add to shop wallet
      shopWallet.balance += amount;
      shopWallet.lastTransactionAt = new Date();
      await shopWallet.save();

      // Create revenue transaction for shop
      const paymentObjectId = paymentId && mongoose.Types.ObjectId.isValid(paymentId)
        ? new mongoose.Types.ObjectId(paymentId)
        : undefined;
      
      await WalletTransactionModel.create({
        shopId,
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
        message: "Money transferred to shop wallet",
        shopWallet: shopWallet.toObject(),
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
        // Deduct from shop wallet
        const shopWallet = await WalletBalanceModel.findOne({ shopId });
        if (shopWallet && shopWallet.balance >= amount) {
          shopWallet.balance -= amount;
          shopWallet.lastTransactionAt = new Date();
          await shopWallet.save();

          // Create transaction for shop (deduction)
          await WalletTransactionModel.create({
            shopId,
            type: WalletTransactionType.REFUND,
            amount: -amount,
            status: WalletTransactionStatus.COMPLETED,
            description: reason || `Hoàn tiền đơn hàng #${orderId} (Đã trừ từ ví shop)`,
            orderId: order._id,
            completedAt: new Date(),
          });
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

