export interface CreateAttributeValueItem {
  value: string;
  label?: string;
  colorCode?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateAttributeTypeRequest {
  name: string;
  code?: string;
  description?: string;
  categoryId?: string;
  isActive?: boolean;
  is_multiple?: boolean;
  inputType?: string;
  helperText?: string;
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
