import { PaymentStatus, PaymentMethod } from "../../models/PaymentModel";

export interface CheckoutRequest {
  orderId: string;
  paymentMethod: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentHistoryQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus | string;
  method?: PaymentMethod | string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: PaymentMethod;
  isActive: boolean;
  config?: {
    // VNPay config
    vnp_TmnCode?: string;
    vnp_HashSecret?: string;
    vnp_Url?: string;
    // MoMo config
    partnerCode?: string;
    accessKey?: string;
    secretKey?: string;
    // PayPal config
    clientId?: string;
    clientSecret?: string;
    // ZaloPay config
    appId?: string;
    key1?: string;
    key2?: string;
    // Bank transfer config
    bankAccounts?: Array<{
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }>;
  };
  icon?: string;
  description?: string;
}

