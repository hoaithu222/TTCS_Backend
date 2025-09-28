export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  status?: string;
  role?: string;
  twoFactorAuth?: boolean;
  twoFactorAuthSecret?: string;
}
