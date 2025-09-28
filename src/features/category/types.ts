export interface CreateCategoryRequest {
  name: string;
  description?: string;
  image: { url: string; publicId: string }[];
  image_Background?: { url: string; publicId: string };
  image_Icon?: { url: string; publicId: string };
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  image?: { url: string; publicId: string }[];
  image_Background?: { url: string; publicId: string };
  image_Icon?: { url: string; publicId: string };
}

export interface DeleteCategoryRequest {
  id: string;
}

export interface GetCategoryRequest {
  id: string;
}

export interface GetCategoriesRequest {
  page?: number;
  limit?: number;
}
// removed duplicate interface
