export interface CreateSubCategoryRequest {
  name: string;
  description?: string;
  categoryId: string;
  image?: { url: string; publicId: string };
  image_Background?: { url: string; publicId: string };
  image_Icon?: { url: string; publicId: string };
}

export interface UpdateSubCategoryRequest {
  name?: string;
  description?: string;
  image?: { url: string; publicId: string };
  image_Background?: { url: string; publicId: string };
  image_Icon?: { url: string; publicId: string };
  isActive?: boolean;
  order_display?: number;
}

export interface ListSubCategoryQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  isActive?: boolean;
}
