import PaymentModel, {
  PaymentStatus,
  PaymentMethod,
} from "../../models/PaymentModel";
import OrderModel, { OrderStatus } from "../../models/OrderModel";
import crypto from "crypto";

const formatVNPayDate = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}${hour}${minute}${second}`;
};

export class VNPayGateway {
  static generatePaymentUrl({
    paymentId,
    amount,
    orderId,
    clientIp,
    returnUrl,
  }: {
    paymentId: string;
    amount: number;
    orderId: string;
    clientIp: string;
    returnUrl: string;
  }) {
    const tmnCode = process.env.VNPAY_TMN_CODE || "";
    const secretKey = process.env.VNPAY_HASH_SECRET || "";
    const vnpUrl =
      process.env.VNPAY_URL ||
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    if (!tmnCode || !secretKey) {
      throw new Error("VNPay chưa được cấu hình đầy đủ");
    }

    const createDate = new Date();
    const expireDate = new Date(createDate.getTime() + 15 * 60 * 1000);
    const params: Record<string, string> = {
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

    const secureHash = crypto
      .createHmac("sha512", secretKey)
      .update(Buffer.from(query, "utf-8"))
      .digest("hex");

    return {
      paymentUrl: `${vnpUrl}?${query}&vnp_SecureHash=${secureHash}`,
      expiresAt: expireDate,
    };
  }
}

/**
 * Test Payment Gateway Service
 * Simulates payment processing for testing purposes
 */
export class TestPaymentGateway {
  /**
   * Generate test payment URL
   */
  static generatePaymentUrl(paymentId: string, amount: number): string {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return `${baseUrl}/payment/test/${paymentId}?amount=${amount}`;
  }

  /**
   * Simulate payment processing
   * In real scenario, this would be called by webhook from payment gateway
   */
  static async processPayment(
    paymentId: string,
    success: boolean = true
  ): Promise<{ ok: boolean; message: string }> {
    try {
      const payment = await PaymentModel.findById(paymentId);
      if (!payment) {
        return { ok: false, message: "Payment not found" };
      }

      if (payment.status !== PaymentStatus.PENDING) {
        return { ok: false, message: "Payment already processed" };
      }

      // Update payment status
      payment.status = success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
      payment.transactionId = `TEST_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      payment.paidAt = success ? new Date() : undefined;
      payment.gatewayResponse = {
        success,
        processedAt: new Date().toISOString(),
        testMode: true,
      };

      await payment.save();

      // Update order status if payment successful
      if (success) {
        await OrderModel.findByIdAndUpdate(payment.orderId, {
          isPay: true,
          status: OrderStatus.PROCESSING,
        });
        // Note: Money will be transferred to shop wallet when order status = DELIVERED
      }

      return {
        ok: true,
        message: success ? "Payment processed successfully" : "Payment failed",
      };
    } catch (error: any) {
      return { ok: false, message: error.message || "Failed to process payment" };
    }
  }
}

/**
 * Webhook handler for payment gateways
 */
export class PaymentWebhookHandler {
  /**
   * Handle VNPay webhook
   */
  static async handleVNPayWebhook(data: any): Promise<{ ok: boolean; message: string }> {
    try {
      // TODO: Verify VNPay signature
      // const isValid = this.verifyVNPaySignature(data);
      // if (!isValid) {
      //   return { ok: false, message: "Invalid signature" };
      // }

      const paymentId = data.vnp_TxnRef; // Payment ID should be stored in vnp_TxnRef
      const responseCode = data.vnp_ResponseCode;
      const isSuccess = responseCode === "00";

      const payment = await PaymentModel.findById(paymentId);
      if (!payment) {
        return { ok: false, message: "Payment not found" };
      }

      if (payment.status !== PaymentStatus.PENDING) {
        return { ok: true, message: "Payment already processed" };
      }

      // Update payment
      payment.status = isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
      payment.transactionId = data.vnp_TransactionNo;
      payment.paidAt = isSuccess ? new Date() : undefined;
      payment.gatewayResponse = data;

      await payment.save();

      // Update order if successful
      if (isSuccess) {
        await OrderModel.findByIdAndUpdate(payment.orderId, {
          isPay: true,
          status: OrderStatus.PROCESSING,
        });
        // Note: Money will be transferred to shop wallet when order status = DELIVERED
      }

      return { ok: true, message: "Webhook processed" };
    } catch (error: any) {
      return { ok: false, message: error.message || "Failed to process webhook" };
    }
  }

  /**
   * Handle MoMo webhook
   */
  static async handleMoMoWebhook(data: any): Promise<{ ok: boolean; message: string }> {
    try {
      // TODO: Verify MoMo signature
      const paymentId = data.orderId;
      const resultCode = data.resultCode;
      const isSuccess = resultCode === 0;

      const payment = await PaymentModel.findById(paymentId);
      if (!payment) {
        return { ok: false, message: "Payment not found" };
      }

      if (payment.status !== PaymentStatus.PENDING) {
        return { ok: true, message: "Payment already processed" };
      }

      payment.status = isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
      payment.transactionId = data.transId;
      payment.paidAt = isSuccess ? new Date() : undefined;
      payment.gatewayResponse = data;

      await payment.save();

      if (isSuccess) {
        await OrderModel.findByIdAndUpdate(payment.orderId, {
          isPay: true,
          status: OrderStatus.PROCESSING,
        });

        // Transfer money to shop wallet
        const { default: WalletHelperService } = await import("../wallet/wallet-helper.service");
        await WalletHelperService.transferToShopWallet(
          payment.orderId.toString(),
          payment.amount,
          payment._id.toString()
        );
      }

      return { ok: true, message: "Webhook processed" };
    } catch (error: any) {
      return { ok: false, message: error.message || "Failed to process webhook" };
    }
  }

  /**
   * Handle ZaloPay webhook
   */
  static async handleZaloPayWebhook(data: any): Promise<{ ok: boolean; message: string }> {
    try {
      // TODO: Verify ZaloPay signature
      const paymentId = data.app_trans_id;
      const returnCode = data.return_code;
      const isSuccess = returnCode === 1;

      const payment = await PaymentModel.findById(paymentId);
      if (!payment) {
        return { ok: false, message: "Payment not found" };
      }

      if (payment.status !== PaymentStatus.PENDING) {
        return { ok: true, message: "Payment already processed" };
      }

      payment.status = isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
      payment.transactionId = data.zp_trans_id;
      payment.paidAt = isSuccess ? new Date() : undefined;
      payment.gatewayResponse = data;

      await payment.save();

      if (isSuccess) {
        await OrderModel.findByIdAndUpdate(payment.orderId, {
          isPay: true,
          status: OrderStatus.PROCESSING,
        });

        // Transfer money to shop wallet
        const { default: WalletHelperService } = await import("../wallet/wallet-helper.service");
        await WalletHelperService.transferToShopWallet(
          payment.orderId.toString(),
          payment.amount,
          payment._id.toString()
        );
      }

      return { ok: true, message: "Webhook processed" };
    } catch (error: any) {
      return { ok: false, message: error.message || "Failed to process webhook" };
    }
  }

  /**
   * Generic webhook handler
   */
  static async handleWebhook(
    gateway: string,
    data: any
  ): Promise<{ ok: boolean; message: string }> {
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

