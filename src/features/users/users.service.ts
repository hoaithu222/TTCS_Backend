import UserModel from "../../models/UserModel";
import { UpdateUserRequest } from "./types";

export default class UsersService {
  // lấy thông tin user
  static async getUser(id: string) {
    const user = await UserModel.findById(id);
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }
    return { ok: true as const, user };
  }
  // cập nhật thông tin user
  static async updateUser(id: string, data: UpdateUserRequest) {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true });
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }
    return { ok: true as const, user };
  }
  // xóa user
  static async deleteUser(id: string) {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }
    return { ok: true as const, user };
  }
  // lấy danh sách user
  static async getUsers() {
    const users = await UserModel.find();
    return { ok: true as const, users };
  }

  // cập nhật avatar của user
  static async updateAvatar(id: string, avatarUrl: string) {
    if (!avatarUrl || typeof avatarUrl !== "string") {
      return {
        ok: false as const,
        status: 400,
        message: "avatar là bắt buộc và phải là string",
      };
    }
    const user = await UserModel.findByIdAndUpdate(
      id,
      { avatar: avatarUrl },
      { new: true }
    );
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }
    return { ok: true as const, user };
  }
}
