"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserModel_1 = __importDefault(require("../../models/UserModel"));
const shop_service_1 = __importDefault(require("../shop/shop.service"));
class UsersService {
    // lấy thông tin user
    static async getUser(id, includeShopStatus = false) {
        const user = await UserModel_1.default.findById(id);
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        const userObj = user.toObject();
        if (includeShopStatus) {
            const shopStatusResult = await shop_service_1.default.getShopStatusByUserId(id);
            if (shopStatusResult.ok) {
                return {
                    ok: true,
                    user: {
                        ...userObj,
                        shopStatus: shopStatusResult.shopStatus,
                        shop: shopStatusResult.shop,
                    },
                };
            }
        }
        return { ok: true, user: userObj };
    }
    // cập nhật thông tin user
    static async updateUser(id, data) {
        const user = await UserModel_1.default.findByIdAndUpdate(id, data, { new: true });
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        return { ok: true, user };
    }
    // xóa user
    static async deleteUser(id) {
        const user = await UserModel_1.default.findByIdAndDelete(id);
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        return { ok: true, user };
    }
    // lấy danh sách user với pagination và filter
    static async getUsers(page = 1, limit = 10, search, status, role, sortBy, sortOrder) {
        try {
            const safePage = Number.isFinite(page) && page > 0 ? page : 1;
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
            const skip = (safePage - 1) * safeLimit;
            // Build filter query
            const filterQuery = {};
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
            const sort = {};
            if (sortBy) {
                sort[sortBy] = sortOrder === "desc" ? -1 : 1;
            }
            else {
                sort.createdAt = -1; // Default sort by createdAt desc
            }
            const [users, total] = await Promise.all([
                UserModel_1.default.find(filterQuery)
                    .skip(skip)
                    .limit(safeLimit)
                    .sort(sort)
                    .select("-password -refreshToken -accessToken -forgotPasswordToken -verifyToken -twoFactorAuthSecret"),
                UserModel_1.default.countDocuments(filterQuery),
            ]);
            return {
                ok: true,
                users,
                total,
                page: safePage,
                limit: safeLimit,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // cập nhật avatar của user
    static async updateAvatar(id, avatarUrl) {
        if (!avatarUrl || typeof avatarUrl !== "string") {
            return {
                ok: false,
                status: 400,
                message: "avatar là bắt buộc và phải là string",
            };
        }
        const user = await UserModel_1.default.findByIdAndUpdate(id, { avatar: avatarUrl }, { new: true });
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        return { ok: true, user };
    }
}
exports.default = UsersService;
