export interface CreateAttributeValueItem {
  value: string;
}

export interface CreateAttributeTypeRequest {
  name: string;
  description?: string;
  categoryId?: string;
  isActive?: boolean;
  is_multiple?: boolean;
  values?: CreateAttributeValueItem[];
}

export interface UpdateAttributeTypeRequest
  extends Partial<CreateAttributeTypeRequest> {}

export interface ListAttributeTypeQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  categoryId?: string;
}
