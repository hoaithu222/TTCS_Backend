import UserAddressModel from "../../models/UserAddressModel";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export interface CreateAddressRequest {
  name: string;
  phone: string;
  addressDetail: string;
  district: string;
  city: string;
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
    if (data.isDefault) {
      await UserAddressModel.updateMany(
        { userId },
        { $set: { isDefault: false } }
      );
    }
    const item = await UserAddressModel.create({ ...data, userId });
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
    if (data.isDefault) {
      await UserAddressModel.updateMany(
        { userId },
        { $set: { isDefault: false } }
      );
    }
    const item = await UserAddressModel.findOneAndUpdate(
      { _id: id, userId },
      data,
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
