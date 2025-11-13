export interface GetMyShopProductsQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  subCategoryId?: string;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetMyShopOrdersQuery {
  page?: number;
  limit?: number;
  orderStatus?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UpdateOrderStatusRequest {
  orderStatus: string;
  trackingNumber?: string;
  notes?: string;
}

export interface GetAnalyticsQuery {
  period?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetReviewsQuery {
  page?: number;
  limit?: number;
  rating?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetFollowersQuery {
  page?: number;
  limit?: number;
}

