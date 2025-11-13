export interface CreateShopRequest {
  userId?: string; // Will be set from auth token
  name: string;
  slug: string;
  description: string;
  logo: string; // Image ID or URL
  banner: string; // Image ID or URL
  // Contact information
  contactEmail: string;
  contactPhone: string;
  contactName: string;
  // Address
  address: {
    provinceCode: number | string;
    districtCode: number | string;
    wardCode: number | string;
  };
  // Business information
  businessType: "individual" | "household" | "enterprise";
  taxId?: string;
  repId: string;
  // Bank information
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  // Documents
  idCardImages?: string[]; // Image IDs or URLs
  businessLicenseImages?: string[]; // Image IDs or URLs
  // Setup information
  shippingPolicy?: string;
  returnPolicy?: string;
  openHour?: string;
  closeHour?: string;
  workingDays?: string;
  facebook?: string;
  zalo?: string;
  instagram?: string;
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







