export interface CreateImageRequest {
  url: string;
  publicId: string;
}

export interface UpdateImageRequest extends Partial<CreateImageRequest> {}

export interface ListImageQuery {
  page?: number;
  limit?: number;
  search?: string; // by url
}









