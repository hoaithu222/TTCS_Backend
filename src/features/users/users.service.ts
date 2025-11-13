import UserModel from "../../models/UserModel";
import { UpdateUserRequest } from "./types";
import ShopService from "../shop/shop.service";

export default class UsersService {
  // lấy thông tin user
  static async getUser(id: string, includeShopStatus = false) {
    const user = await UserModel.findById(id);
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }
    const userObj = user.toObject();
    
    if (includeShopStatus) {
      const shopStatusResult = await ShopService.getShopStatusByUserId(id);
      if (shopStatusResult.ok) {
        return {
          ok: true as const,
          user: {
            ...userObj,
            shopStatus: shopStatusResult.shopStatus,
            shop: shopStatusResult.shop,
          },
        };
      }
    }
    
    return { ok: true as const, user: userObj };
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
  // lấy danh sách user với pagination và filter
  static async getUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: "active" | "inactive" | "suspended",
    role?: "admin" | "user" | "moderator",
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit =
        Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
      const skip = (safePage - 1) * safeLimit;

      // Build filter query
      const filterQuery: any = {};

      // Add search filter (case insensitive) - search by name or email
      if (search && search.trim()) {
        filterQuery.$or = [
          { name: { $regex: search.trim(), $options: "i" } },
          { email: { $regex: search.trim(), $options: "i" } },
        ];
      }

      // Add status filter
      if (status) {
        filterQuery.status = status;
      }

      // Add role filter
      if (role) {
        filterQuery.role = role;
      }

      // Build sort
      const sort: any = {};
      if (sortBy) {
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
      } else {
        sort.createdAt = -1; // Default sort by createdAt desc
      }

      const [users, total] = await Promise.all([
        UserModel.find(filterQuery)
          .skip(skip)
          .limit(safeLimit)
          .sort(sort)
          .select("-password -refreshToken -accessToken -forgotPasswordToken -verifyToken -twoFactorAuthSecret"),
        UserModel.countDocuments(filterQuery),
      ]);

      return {
        ok: true as const,
        users,
        total,
        page: safePage,
        limit: safeLimit,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
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
