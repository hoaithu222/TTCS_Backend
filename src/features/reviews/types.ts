export interface CreateReviewRequest {
  productId: string;
  shopId: string;
  rating: number; // 1..5
  comment?: string;
  images?: string[]; // Image IDs
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  images?: string[];
}

export interface ListReviewsQuery {
  page?: number;
  limit?: number;
  productId?: string;
  shopId?: string;
  userId?: string;
  sortBy?: "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
}
