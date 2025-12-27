export interface CreateProductRequest {
  name: string;
  description: string;
  images: string[]; // array of Image IDs
  shopId: string;
  subCategoryId: string;
  categoryId: string;
  price: number;
  discount?: number;
  stock?: number;
  rating?: number; // 0-5, default 0
  salesCount?: number; // default 0
  warrantyInfo: string;
  weight?: number;
  dimensions: string;
  metaKeywords: string;
  viewCount?: number; // default 0
  isActive?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface ListProductQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  subCategoryId?: string;
  shopId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  isActive?: boolean;
  status?: "approved" | "hidden" | "violated";
  sortBy?: "createdAt" | "price" | "rating" | "salesCount" | "viewCount";
  sortOrder?: "asc" | "desc";
}

export interface UpdateProductStatusRequest {
  status: "pending" | "approved" | "hidden" | "violated";
  violationNote?: string;
}
