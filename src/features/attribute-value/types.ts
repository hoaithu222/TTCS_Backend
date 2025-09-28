export interface CreateAttributeValueRequest {
  attributeTypeId: string;
  value: string;
}

export interface UpdateAttributeValueRequest
  extends Partial<CreateAttributeValueRequest> {}

export interface ListAttributeValueQuery {
  page?: number;
  limit?: number;
  attributeTypeId?: string;
  search?: string;
}
