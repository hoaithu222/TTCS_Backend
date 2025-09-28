export interface AddressQuery {}

export interface CreateAddressRequest {
  name: string;
  phone: string;
  addressDetail: string;
  district: string;
  city: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}
