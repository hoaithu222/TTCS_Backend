export interface CreateShopRequest {
  userId: string;
  name: string;
  description: string;
  logo: string; // Image ID
  banner: string; // Image ID
}

export interface UpdateShopRequest extends Partial<CreateShopRequest> {
  status?: "pending" | "active" | "blocked";
  rating?: number;
}

export interface ListShopQuery {
  page?: number;
  limit?: number;
  userId?: string;
  search?: string; // by name
  status?: "pending" | "active" | "blocked";
}

