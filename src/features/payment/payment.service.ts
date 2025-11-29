import PaymentModel, {
  PaymentStatus,
  PaymentMethod,
} from "../../models/PaymentModel";
import OrderModel, { OrderStatus } from "../../models/OrderModel";
import { TestPaymentGateway, VNPayGateway } from "./payment-gateway.service";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import { notificationService } from "../../shared/services/notification.service";
import type {
  CheckoutRequest,
  PaymentHistoryQuery,
  PaymentMethodConfig,
} from "./types";

const CLIENT_APP_URL =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:5174";

// Sepay test mode: giới hạn số tiền thực chuyển để test (QR amount < 10.000 VNĐ)
const SEPAY_TEST_MODE =
  process.env.SEPAY_TEST_MODE === "true" || process.env.NODE_ENV !== "production";
const SEPAY_TEST_MAX_AMOUNT =
  Number.parseInt(process.env.SEPAY_TEST_MAX_AMOUNT || "3000", 10) || 3000;

const getSepayAmount = (originalAmount: number) => {
  if (!SEPAY_TEST_MODE) return originalAmount;
  return Math.max(1000, Math.min(originalAmount, SEPAY_TEST_MAX_AMOUNT));
};

export default class PaymentService {
  /**
   * Get available payment methods
   * This can be extended to fetch from database or config
   */
  static async getPaymentMethods(): Promise<PaymentMethodConfig[]> {
    const methods: PaymentMethodConfig[] = [
      {
        id: "cod",
        name: "Thanh toán khi nhận hàng",
        type: PaymentMethod.COD,
        isActive: true,
        description: "Thanh toán bằng tiền mặt khi nhận hàng",
        icon: "cash",
      },
      {
        id: "bank_transfer",
        name: "Chuyển khoản qua ngân hàng (Sepay)",
        type: PaymentMethod.BANK_TRANSFER,
        isActive: true,
        description:
          "Chuyển khoản qua QR ngân hàng/Sepay vào tài khoản của cửa hàng",
        icon: "bank",
        config: {
          bankAccounts: [
            {
              bankName: process.env.BANK_NAME || "MBBank",
              accountNumber:
                process.env.BANK_ACCOUNT_NUMBER || "0000000000",
              accountHolder:
                process.env.BANK_ACCOUNT_HOLDER || "Cửa hàng",
            },
          ],
        },
      },
      {
        id: "wallet",
        name: "Thanh toán bằng ví",
        type: PaymentMethod.WALLET,
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
  static async createCheckout(
    req: AuthenticatedRequest,
    data: CheckoutRequest
  ) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      // Verify order exists and belongs to user
      const order = await OrderModel.findOne({
        _id: data.orderId,
        userId: userId,
      });

      if (!order) {
        return {
          ok: false as const,
          status: 404,
          message: "Order not found",
        };
      }

      // Build default URLs
      const defaultReturnUrl =
        data.returnUrl ||
        PaymentService.buildReturnUrl(order._id.toString());
      const defaultCancelUrl =
        data.cancelUrl || PaymentService.buildCancelUrl(order._id.toString());

      // Check if payment already exists for this order
      const existingPayment = await PaymentModel.findOne({
        orderId: data.orderId,
        userId: userId,
      });

      // If payment already exists, return existing payment info
      if (existingPayment) {
        const paymentObj = existingPayment.toObject();
        let response: any = {
          paymentId: paymentObj._id.toString(),
          paymentUrl: undefined as string | undefined,
          instructions: paymentObj.instructions || undefined,
        };

        // If payment is completed, return existing payment (no need to create new)
        if (existingPayment.status === PaymentStatus.COMPLETED) {
          return {
            ok: true as const,
            checkout: response,
          };
        }

        // If payment is pending/processing, return existing payment
        if (existingPayment.status === PaymentStatus.PENDING || 
            existingPayment.status === PaymentStatus.PROCESSING) {
          return {
            ok: true as const,
            checkout: response,
          };
        }

        // If payment is failed/cancelled, allow creating new payment with different method
        // But check if user wants to use the same method or different method
        const availableMethods = await this.getPaymentMethods();
        const methodExists = availableMethods.find(
          (m) => m.id === data.paymentMethod || m.type === data.paymentMethod
        );

        // If same method and failed, return existing (user can retry)
        if (existingPayment.method === methodExists?.type && 
            (existingPayment.status === PaymentStatus.FAILED || 
             existingPayment.status === PaymentStatus.CANCELLED)) {
          return {
            ok: true as const,
            checkout: response,
          };
        }

        // If different method, continue to create new payment below
        // (existing payment will remain in DB but new one will be created)
      }

      // Validate payment method
      const availableMethods = await this.getPaymentMethods();
      const methodExists = availableMethods.find(
        (m) => m.id === data.paymentMethod || m.type === data.paymentMethod
      );

      if (!methodExists) {
        return {
          ok: false as const,
          status: 400,
          message: "Invalid payment method",
        };
      }

      const payment = new PaymentModel({
        orderId: data.orderId,
        userId: userId,
        amount: Math.max(0, order.totalAmount || 0),
        currency: "VND",
        method: methodExists.type,
        status: PaymentStatus.PENDING,
        returnUrl: defaultReturnUrl,
        cancelUrl: defaultCancelUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      let response: any = {
        paymentId: payment._id.toString(),
        paymentUrl: undefined as string | undefined,
        instructions: undefined as string | undefined,
        qrCode: undefined as string | undefined,
      };

      switch (methodExists.type) {
        case PaymentMethod.COD: {
          payment.status = PaymentStatus.COMPLETED;
          payment.paidAt = new Date();
          payment.instructions = "Vui lòng chuẩn bị tiền mặt khi nhận hàng.";
          response.instructions = payment.instructions;
          await OrderModel.findByIdAndUpdate(order._id, {
            isPay: true,
            status: OrderStatus.PROCESSING,
          });
          break;
        }
        case PaymentMethod.BANK_TRANSFER: {
          const bankAccounts = methodExists.config?.bankAccounts || [];
          payment.instructions = PaymentService.buildBankTransferInstructions(
            order._id.toString(),
            bankAccounts
          );
          // Tạo QR Sepay cho chuyển khoản ngân hàng
          const bankInfo = bankAccounts[0];
          if (bankInfo) {
            const QR_CODE_BASE_URL = "https://qr.sepay.vn/img";
            const description = encodeURIComponent(
              `Thanh toan don hang ${order._id.toString()}`
            );
            const sepayAmount = getSepayAmount(payment.amount);
            const qrCodeUrl = `${QR_CODE_BASE_URL}?bank=${encodeURIComponent(
              bankInfo.bankName
            )}&acc=${
              bankInfo.accountNumber
            }&template=compact&amount=${sepayAmount}&des=${description}`;
            payment.qrCode = qrCodeUrl;
            // Lưu sepayAmount vào gatewayResponse để webhook so sánh đúng
            payment.gatewayResponse = {
              ...(payment.gatewayResponse || {}),
              sepayAmount,
              originalAmount: payment.amount,
            };
            response.qrCode = qrCodeUrl;
          }

          // Gia hạn lâu hơn cho chuyển khoản
          payment.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          response.instructions = payment.instructions;
          break;
        }
        case PaymentMethod.WALLET: {
          // Check wallet balance
          const { WalletBalanceModel } = await import("../../models/WalletModel");
          const wallet = await WalletBalanceModel.findOne({ userId });
          
          if (!wallet || wallet.balance < payment.amount) {
            return {
              ok: false as const,
              status: 400,
              message: `Số dư ví không đủ. Số dư hiện tại: ${(wallet?.balance || 0).toLocaleString('vi-VN')} VNĐ. Vui lòng nạp thêm tiền.`,
            };
          }

          // Deduct from wallet
          wallet.balance -= payment.amount;
          wallet.lastTransactionAt = new Date();
          await wallet.save();

          // Create wallet transaction
          const { WalletTransactionModel, WalletTransactionType, WalletTransactionStatus } = await import("../../models/WalletModel");
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
          payment.status = PaymentStatus.COMPLETED;
          payment.paidAt = new Date();
          payment.transactionId = `WALLET_${payment._id.toString()}`;
          payment.instructions = `Đã thanh toán thành công bằng ví. Số dư còn lại: ${wallet.balance.toLocaleString('vi-VN')} VNĐ`;
          response.instructions = payment.instructions;

          // Update order
          await OrderModel.findByIdAndUpdate(order._id, {
            isPay: true,
            status: OrderStatus.PROCESSING,
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
        ok: true as const,
        checkout: response,
      };
    } catch (error: any) {
      return {
        ok: false as const,
        status: 500,
        message: error.message || "Failed to create checkout",
      };
    }
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(
    req: AuthenticatedRequest,
    orderId: string
  ) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const payment = await PaymentModel.findOne({
        orderId: orderId,
        userId: userId,
      });

      if (!payment) {
        return {
          ok: false as const,
          status: 404,
          message: "Payment not found",
        };
      }

      // Nếu là chuyển khoản ngân hàng và chưa có QR nhưng vẫn đang chờ xử lý,
      // tự động tạo lại QR + hướng dẫn để đảm bảo luôn có màn thanh toán QR.
      if (
        payment.method === PaymentMethod.BANK_TRANSFER &&
        (payment.status === PaymentStatus.PENDING ||
          payment.status === PaymentStatus.PROCESSING) &&
        !payment.qrCode
      ) {
        const methods = await this.getPaymentMethods();
        const bankMethod = methods.find((m) => m.type === PaymentMethod.BANK_TRANSFER);
        const bankAccounts = bankMethod?.config?.bankAccounts || [];
        const bankInfo = bankAccounts[0];

        if (bankInfo) {
          const QR_CODE_BASE_URL = "https://qr.sepay.vn/img";
          const description = encodeURIComponent(
            `Thanh toan don hang ${payment.orderId.toString()}`
          );
          const sepayAmount = getSepayAmount(payment.amount);
          const qrCodeUrl = `${QR_CODE_BASE_URL}?bank=${encodeURIComponent(
            bankInfo.bankName
          )}&acc=${bankInfo.accountNumber}&template=compact&amount=${sepayAmount}&des=${description}`;

          payment.qrCode = qrCodeUrl;
          // Lưu sepayAmount vào gatewayResponse để webhook so sánh đúng
          payment.gatewayResponse = {
            ...(payment.gatewayResponse || {}),
            sepayAmount,
            originalAmount: payment.amount,
          };
          if (!payment.instructions) {
            payment.instructions = PaymentService.buildBankTransferInstructions(
              payment.orderId.toString(),
              bankAccounts
            );
          }
          if (!payment.expiresAt) {
            payment.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          }
          await payment.save();
        }
      }

      // Convert to object và đảm bảo orderId là string, không phải object
      const paymentObj = payment.toObject();
      // Ensure orderId is always a string (in case it was populated)
      if (paymentObj.orderId && typeof paymentObj.orderId === "object") {
        (paymentObj as any).orderId =
          paymentObj.orderId._id?.toString() || paymentObj.orderId.toString();
      }

      return {
        ok: true as const,
        payment: paymentObj,
      };
    } catch (error: any) {
      return {
        ok: false as const,
        status: 500,
        message: error.message || "Failed to get payment status",
      };
    }
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(
    req: AuthenticatedRequest,
    query: PaymentHistoryQuery
  ) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const page = parseInt(query.page as any) || 1;
      const limit = parseInt(query.limit as any) || 10;
      const skip = (page - 1) * limit;

      // Build filter
      const filter: any = { userId: userId };

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
      const sort: any = {};
      if (query.sortBy) {
        sort[query.sortBy] = query.sortOrder === "desc" ? -1 : 1;
      } else {
        sort.createdAt = -1; // Default: newest first
      }

      const [payments, total] = await Promise.all([
        PaymentModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("orderId")
          .lean(),
        PaymentModel.countDocuments(filter),
      ]);

      return {
        ok: true as const,
        payments,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      return {
        ok: false as const,
        status: 500,
        message: error.message || "Failed to get payment history",
      };
    }
  }

  /**
   * Confirm bank transfer payment manually (admin or user with proof)
   */
  static async confirmBankTransfer(
    req: AuthenticatedRequest,
    paymentId: string,
    transactionId?: string
  ) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const payment = await PaymentModel.findOne({
        _id: paymentId,
        userId: userId,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      });

      if (!payment) {
        return {
          ok: false as const,
          status: 404,
          message: "Payment not found or already processed",
        };
      }

      // Update payment status
      payment.status = PaymentStatus.COMPLETED;
      payment.transactionId = transactionId || `BANK_${Date.now()}`;
      payment.paidAt = new Date();
      payment.gatewayResponse = {
        confirmedBy: userId,
        confirmedAt: new Date().toISOString(),
        manualConfirmation: true,
      };

      await payment.save();

      // Update order
      const updatedOrder = await OrderModel.findByIdAndUpdate(payment.orderId, {
        isPay: true,
        status: OrderStatus.PROCESSING,
      }, { new: true });
      // Gửi thông báo cho người dùng khi thanh toán chuyển khoản được xác nhận
      if (updatedOrder) {
        await notificationService.notifyUserOrderStatus({
          userId: updatedOrder.userId.toString(),
          orderId: updatedOrder._id.toString(),
          status: updatedOrder.status,
          shopName: undefined,
        });
      }
      // Note: Money will be transferred to shop wallet when order status = DELIVERED

      return {
        ok: true as const,
        payment: payment.toObject(),
      };
    } catch (error: any) {
      return {
        ok: false as const,
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
  static async confirmBankTransferFromWebhook(
    orderId: string,
    transactionId: string,
    amount: number
  ) {
    try {
      const payment = await PaymentModel.findOne({
        orderId,
        method: PaymentMethod.BANK_TRANSFER,
      }).sort({ createdAt: -1 });

      if (!payment) {
        return {
          ok: false as const,
          status: 404,
          message: "Payment not found for this order",
        };
      }

      // Nếu đã hoàn thành thì bỏ qua (idempotent)
      if (payment.status === PaymentStatus.COMPLETED) {
        return { ok: true as const, payment: payment.toObject() };
      }

      if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.PROCESSING) {
        return {
          ok: false as const,
          status: 400,
          message: "Payment is not in a confirmable state",
        };
      }

      // Verify amount (cho phép lệch 1.000 VNĐ do test mode / làm tròn)
      // Trong test mode, QR code hiển thị sepayAmount (nhỏ hơn), nhưng payment.amount vẫn là số tiền gốc
      // Nếu có gatewayResponse.sepayAmount, so sánh với nó
      // Nếu không có (payment cũ), tính lại sepayAmount từ payment.amount
      let expectedAmount = payment.amount;
      const sepayAmount = (payment.gatewayResponse as any)?.sepayAmount;
      
      if (sepayAmount) {
        expectedAmount = sepayAmount;
      } else if (SEPAY_TEST_MODE && payment.amount > SEPAY_TEST_MAX_AMOUNT) {
        // Payment cũ: tính lại sepayAmount từ số tiền gốc
        expectedAmount = getSepayAmount(payment.amount);
      }
      
      if (Math.abs(expectedAmount - amount) > 1000) {
        return {
          ok: false as const,
          status: 400,
          message: `Amount mismatch: expected ${expectedAmount} (sepayAmount: ${sepayAmount || 'calculated'}, original: ${payment.amount}), received ${amount}`,
        };
      }

      payment.status = PaymentStatus.COMPLETED;
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
      const updatedOrder = await OrderModel.findByIdAndUpdate(
        payment.orderId,
        {
          isPay: true,
          status: OrderStatus.PROCESSING,
        },
        { new: true }
      );

      if (updatedOrder) {
        // Gửi thông báo cho user về thanh toán thành công
        await notificationService.createAndEmit({
          userId: updatedOrder.userId.toString(),
          title: "Thanh toán thành công",
          content: `Đơn hàng #${updatedOrder._id.toString().slice(-6).toUpperCase()} đã được thanh toán thành công qua chuyển khoản ngân hàng (Sepay).`,
          type: "payment:success",
          icon: "check-circle",
          actionUrl: `/payment/result/${updatedOrder._id.toString()}`,
          metadata: {
            orderId: updatedOrder._id.toString(),
            paymentId: payment._id.toString(),
            amount: payment.amount,
            method: "bank_transfer",
          },
          priority: "high",
        });
        
        // Gửi thông báo về cập nhật trạng thái đơn
        await notificationService.notifyUserOrderStatus({
          userId: updatedOrder.userId.toString(),
          orderId: updatedOrder._id.toString(),
          status: updatedOrder.status,
          shopName: undefined,
        });
      }

      return {
        ok: true as const,
        payment: payment.toObject(),
      };
    } catch (error: any) {
      return {
        ok: false as const,
        status: 500,
        message: error.message || "Failed to confirm bank transfer from webhook",
      };
    }
  }
  private static getClientIp(req: AuthenticatedRequest): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0];
    }
    const remote =
      (req.socket && req.socket.remoteAddress) ||
      (req as any).ip ||
      "127.0.0.1";
    return remote.replace(/^::ffff:/, "");
  }

  private static buildReturnUrl(orderId: string) {
    const base = CLIENT_APP_URL.endsWith("/")
      ? CLIENT_APP_URL.slice(0, -1)
      : CLIENT_APP_URL;
    return `${base}/payment/${orderId}`;
  }

  private static buildCancelUrl(orderId: string) {
    const base = CLIENT_APP_URL.endsWith("/")
      ? CLIENT_APP_URL.slice(0, -1)
      : CLIENT_APP_URL;
    return `${base}/orders/${orderId}`;
  }

  private static buildBankTransferInstructions(
    orderId: string,
    bankAccounts: Array<{
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }>
  ) {
    if (!bankAccounts.length) {
      return `Vui lòng liên hệ cửa hàng để được cung cấp thông tin chuyển khoản.\nNội dung chuyển khoản: ${orderId}`;
    }
    const accountLines = bankAccounts
      .map(
        (acc) =>
          `• ${acc.bankName}: ${acc.accountNumber} - ${acc.accountHolder}`
      )
      .join("\n");
    return [
      "Vui lòng chuyển khoản theo thông tin bên dưới:",
      accountLines,
      `Nội dung chuyển khoản: ${orderId}`,
      "Sau khi chuyển khoản, vui lòng xác nhận với shop để đơn hàng được xử lý.",
    ].join("\n");
  }
}

