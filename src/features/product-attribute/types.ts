export interface CreateProductAttributeRequest {
  productId: string;
  attributeTypeId: string;
  combination: Record<string, string | number>;
  price: number;
  stock?: number;
  image_url?: string;
  barcode?: string;
}

export interface UpdateProductAttributeRequest
  extends Partial<CreateProductAttributeRequest> {}

export interface ListProductAttributeQuery {
  page?: number;
  limit?: number;
  productId?: string;
  attributeTypeId?: string;
}
