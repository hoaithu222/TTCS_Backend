import UserAddressModel from "../../models/UserAddressModel";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

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

export default class AddressService {
  static async list(req: AuthenticatedRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    const items = await UserAddressModel.find({ userId }).sort({
      isDefault: -1,
      updatedAt: -1,
    });
    return { ok: true as const, items };
  }

  static async create(req: AuthenticatedRequest, data: CreateAddressRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    // normalize incoming shapes from various clients
    const normalizedAddressDetail =
      data.addressDetail ||
      data.address ||
      (data as any).address_line1 ||
      "";
    const normalizedWard = data.ward || (data as any).ward || "";
    
    // Kiểm tra số lượng địa chỉ hiện có
    const existingAddressCount = await UserAddressModel.countDocuments({ userId });
    
    // Nếu đây là địa chỉ đầu tiên, tự động set làm mặc định
    // Nếu không phải địa chỉ đầu tiên, sử dụng giá trị từ request
    const shouldBeDefault = existingAddressCount === 0 
      ? true 
      : Boolean((data as any).is_default ?? data.isDefault);
    
    const normalizedData: any = {
      name: (data as any).recipient_name || data.name,
      phone: data.phone,
      addressDetail: normalizedAddressDetail,
      address: data.address || `${(data as any).address_line2 || ""} ${(data as any).address_line1 || ""}`.trim() || normalizedAddressDetail,
      district: data.district,
      city: data.city,
      ward: normalizedWard,
      isDefault: shouldBeDefault,
    };
    
    // Nếu địa chỉ mới được set làm mặc định, hủy mặc định của các địa chỉ khác
    if (normalizedData.isDefault) {
      await UserAddressModel.updateMany(
        { userId },
        { $set: { isDefault: false } }
      );
    }
    const item = await UserAddressModel.create({ ...normalizedData, userId });
    return { ok: true as const, item };
  }

  static async update(
    req: AuthenticatedRequest,
    id: string,
    data: UpdateAddressRequest
  ) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    const normalized: any = { ...data };
    if ((data as any).is_default !== undefined) {
      normalized.isDefault = Boolean((data as any).is_default);
    }
    if ((data as any).recipient_name) normalized.name = (data as any).recipient_name;
    if ((data as any).address_line1 || (data as any).address_line2) {
      const addr =
        `${(data as any).address_line2 || ""} ${(data as any).address_line1 || ""}`.trim();
      normalized.address = addr;
      normalized.addressDetail = (data as any).address_line1 || addr;
    }
    // Nếu địa chỉ được update là mặc định, hủy mặc định của các địa chỉ khác TRƯỚC KHI update
    if (normalized.isDefault === true) {
      await UserAddressModel.updateMany(
        { userId, _id: { $ne: id } }, // Loại trừ địa chỉ đang được update
        { $set: { isDefault: false } }
      );
    }
    const item = await UserAddressModel.findOneAndUpdate(
      { _id: id, userId },
      normalized,
      { new: true }
    );
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "Địa chỉ không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async delete(req: AuthenticatedRequest, id: string) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    const item = await UserAddressModel.findOneAndDelete({ _id: id, userId });
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "Địa chỉ không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async setDefault(req: AuthenticatedRequest, id: string) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    await UserAddressModel.updateMany(
      { userId },
      { $set: { isDefault: false } }
    );
    const updated = await UserAddressModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isDefault: true } },
      { new: true }
    );
    if (!updated)
      return {
        ok: false as const,
        status: 404,
        message: "Địa chỉ không tồn tại",
      };
    const items = await UserAddressModel.find({ userId }).sort({
      isDefault: -1,
      updatedAt: -1,
    });
    return { ok: true as const, items };
  }

  static async getById(req: AuthenticatedRequest, id: string) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    const item = await UserAddressModel.findOne({ _id: id, userId });
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "Địa chỉ không tồn tại",
      };
    return { ok: true as const, item };
  }
}
