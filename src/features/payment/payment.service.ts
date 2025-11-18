import PaymentModel, {
  PaymentStatus,
  PaymentMethod,
} from "../../models/PaymentModel";
import OrderModel, { OrderStatus } from "../../models/OrderModel";
import { TestPaymentGateway, VNPayGateway } from "./payment-gateway.service";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import type {
  CheckoutRequest,
  PaymentHistoryQuery,
  PaymentMethodConfig,
} from "./types";

const CLIENT_APP_URL =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "http://localhost:5174";

export default class PaymentService {
  /**
   * Get available payment methods
   * This can be extended to fetch from database or config
   */
  static async getPaymentMethods(): Promise<PaymentMethodConfig[]> {
    const isVNPayConfigured =
      !!process.env.VNPAY_TMN_CODE && !!process.env.VNPAY_HASH_SECRET;
    const isMomoConfigured =
      !!process.env.MOMO_PARTNER_CODE &&
      !!process.env.MOMO_ACCESS_KEY &&
      !!process.env.MOMO_SECRET_KEY;
    const isZaloPayConfigured =
      !!process.env.ZALOPAY_APP_ID &&
      !!process.env.ZALOPAY_KEY1 &&
      !!process.env.ZALOPAY_KEY2;

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
        name: "Chuyển khoản ngân hàng",
        type: PaymentMethod.BANK_TRANSFER,
        isActive: true,
        description: "Chuyển khoản trực tiếp vào tài khoản ngân hàng",
        icon: "bank",
        config: {
          bankAccounts: [
            {
              bankName: "Vietcombank",
              accountNumber: "1234567890",
              accountHolder: "Công ty TNHH ABC",
            },
          ],
        },
      },
      {
        id: "vnpay",
        name: "VNPay",
        type: PaymentMethod.VNPAY,
        isActive: isVNPayConfigured,
        description: "Thanh toán qua cổng VNPay",
        icon: "vnpay",
        config: {
          // These should come from environment variables
          vnp_TmnCode: process.env.VNPAY_TMN_CODE || "",
          vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "",
          vnp_Url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        },
      },
      {
        id: "momo",
        name: "MoMo",
        type: PaymentMethod.MOMO,
        isActive: isMomoConfigured,
        description: "Thanh toán qua ví điện tử MoMo",
        icon: "momo",
        config: {
          partnerCode: process.env.MOMO_PARTNER_CODE || "",
          accessKey: process.env.MOMO_ACCESS_KEY || "",
          secretKey: process.env.MOMO_SECRET_KEY || "",
        },
      },
      {
        id: "zalopay",
        name: "ZaloPay",
        type: PaymentMethod.ZALOPAY,
        isActive: isZaloPayConfigured,
        description: "Thanh toán qua ví điện tử ZaloPay",
        icon: "zalopay",
        config: {
          appId: process.env.ZALOPAY_APP_ID || "",
          key1: process.env.ZALOPAY_KEY1 || "",
          key2: process.env.ZALOPAY_KEY2 || "",
        },
      },
      {
        id: "credit_card",
        name: "Thẻ tín dụng",
        type: PaymentMethod.CREDIT_CARD,
        isActive: false, // Disabled until integrated
        description: "Thanh toán bằng thẻ tín dụng",
        icon: "credit-card",
      },
      {
        id: "paypal",
        name: "PayPal",
        type: PaymentMethod.PAYPAL,
        isActive: false, // Disabled until integrated
        description: "Thanh toán qua PayPal",
        icon: "paypal",
        config: {
          clientId: process.env.PAYPAL_CLIENT_ID || "",
          clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
        },
      },
      {
        id: "test",
        name: "Test Payment (Miễn phí)",
        type: PaymentMethod.TEST,
        isActive: process.env.NODE_ENV !== "production", // Only in development
        description: "Phương thức thanh toán test để kiểm thử (không tính phí thật)",
        icon: "test",
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

      // Check if payment already exists for this order
      const existingPayment = await PaymentModel.findOne({
        orderId: data.orderId,
        status: { $in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
      });

      if (existingPayment) {
        return {
          ok: false as const,
          status: 400,
          message: "Payment already exists for this order",
        };
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

      const defaultReturnUrl =
        data.returnUrl ||
        PaymentService.buildReturnUrl(order._id.toString());
      const defaultCancelUrl =
        data.cancelUrl || PaymentService.buildCancelUrl(order._id.toString());

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
          payment.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          response.instructions = payment.instructions;
          break;
        }
        case PaymentMethod.VNPAY: {
          const { paymentUrl, expiresAt } = VNPayGateway.generatePaymentUrl({
            paymentId: payment._id.toString(),
            amount: payment.amount,
            orderId: order._id.toString(),
            clientIp: PaymentService.getClientIp(req),
            returnUrl: payment.returnUrl || defaultReturnUrl,
          });
          payment.expiresAt = expiresAt;
          response.paymentUrl = paymentUrl;
          break;
        }
        case PaymentMethod.TEST: {
          const paymentUrl = TestPaymentGateway.generatePaymentUrl(
            payment._id.toString(),
            payment.amount
          );
          payment.instructions =
            "Đây là phương thức thanh toán test. Bạn có thể mô phỏng kết quả.";
          response.paymentUrl = paymentUrl;
          response.instructions = payment.instructions;
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

      // Convert to object and ensure orderId is a string, not an object
      const paymentObj = payment.toObject();
      // Ensure orderId is always a string (in case it was populated)
      if (paymentObj.orderId && typeof paymentObj.orderId === 'object') {
        paymentObj.orderId = paymentObj.orderId._id?.toString() || paymentObj.orderId.toString();
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
      await OrderModel.findByIdAndUpdate(payment.orderId, {
        isPay: true,
        status: OrderStatus.PROCESSING,
      });

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

