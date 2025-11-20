export interface CreateAttributeValueRequest {
  attributeTypeId: string;
  value: string;
  label?: string;
  colorCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateAttributeValueRequest
  extends Partial<CreateAttributeValueRequest> {}

export interface ListAttributeValueQuery {
  page?: number;
  limit?: number;
  attributeTypeId?: string;
  search?: string;
}

