export interface AddressQuery {}

export interface CreateAddressRequest {
  name: string;
  phone: string;
  addressDetail?: string;
  address?: string;
  district: string;
  city: string;
  ward?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}
