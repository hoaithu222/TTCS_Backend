export interface AddToWishlistRequest {
  productId: string;
}

export interface WishlistItemResponse {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  productPrice: number;
  productDiscount?: number;
  finalPrice: number;
  shopId: string;
  shopName: string;
  addedAt: string;
}

export interface WishlistResponse {
  _id: string;
  userId: string;
  items: WishlistItemResponse[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

