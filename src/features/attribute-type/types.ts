export interface CreateAttributeTypeRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  is_multiple?: boolean;
}

export interface UpdateAttributeTypeRequest
  extends Partial<CreateAttributeTypeRequest> {}

export interface ListAttributeTypeQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
