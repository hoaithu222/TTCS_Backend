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
  warrantyInfo: string;
  weight?: number;
  dimensions: string;
  metaKeywords: string;
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
  isActive?: boolean;
  sortBy?: "createdAt" | "price" | "rating" | "salesCount" | "viewCount";
  sortOrder?: "asc" | "desc";
}
