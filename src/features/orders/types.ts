import { OrderStatus } from "../../models/OrderModel";

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus | string;
  shopId?: string;
  userId?: string; // admin only
  sortBy?: "createdAt" | "totalAmount";
  sortOrder?: "asc" | "desc";
}

export interface UpdateOrderRequest {
  addressId?: string;
  shippingFee?: number;
  notes?: string;
  trackingNumber?: string;
  courierName?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  description?: string;
}
