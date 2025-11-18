"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
const ShopFollower_1 = __importDefault(require("../../models/ShopFollower"));
class ShopService {
    static async get(id) {
        // Check if id is a valid ObjectId (24 hex characters)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        let item;
        if (isObjectId) {
            // Try to find by _id first
            item = await ShopModel_1.default.findById(id);
        }
        // If not found by _id or not an ObjectId, try to find by slug
        if (!item) {
            item = await ShopModel_1.default.findOne({ slug: id });
        }
        if (!item)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        return { ok: true, item };
    }
    static async create(data) {
        try {
            const item = await ShopModel_1.default.create(data);
            return { ok: true, item };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    static async update(id, data) {
        const item = await ShopModel_1.default.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (!item)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        return { ok: true, item };
    }
    static async delete(id) {
        const item = await ShopModel_1.default.findByIdAndDelete(id);
        if (!item)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        return { ok: true, item };
    }
    static async list(query) {
        try {
            const page = Number.isFinite(query.page) && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit > 0
                ? Math.min(query.limit, 100)
                : 10;
            const skip = (page - 1) * limit;
            const filter = {};
            if (query.userId)
                filter.userId = query.userId;
            if (query.status)
                filter.status = query.status;
            if (query.search)
                filter.name = { $regex: query.search, $options: "i" };
            const [items, total] = await Promise.all([
                ShopModel_1.default.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
                ShopModel_1.default.countDocuments(filter),
            ]);
            return { ok: true, items, total, page, limit };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    static async follow(shopId, userId) {
        const shop = await ShopModel_1.default.findById(shopId).select("_id followCount userId");
        if (!shop)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        if (shop.userId && shop.userId.toString() === userId) {
            return {
                ok: false,
                status: 400,
                message: "Bạn không thể theo dõi cửa hàng của chính mình",
            };
        }
        try {
            await ShopFollower_1.default.create({ shopId, userId });
        }
        catch (error) {
            // Duplicate follows should be idempotent
            if (error.code !== 11000) {
                return {
                    ok: false,
                    status: 400,
                    message: error.message,
                };
            }
        }
        const followersCount = await ShopFollower_1.default.countDocuments({ shopId });
        await ShopModel_1.default.findByIdAndUpdate(shopId, { followCount: followersCount });
        return { ok: true, isFollowing: true, followersCount };
    }
    static async unfollow(shopId, userId) {
        const shop = await ShopModel_1.default.findById(shopId).select("_id");
        if (!shop)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        await ShopFollower_1.default.findOneAndDelete({ shopId, userId });
        const followersCount = await ShopFollower_1.default.countDocuments({ shopId });
        await ShopModel_1.default.findByIdAndUpdate(shopId, { followCount: followersCount });
        return { ok: true, isFollowing: false, followersCount };
    }
    static async isFollowing(shopId, userId) {
        const [doc, followersCount] = await Promise.all([
            ShopFollower_1.default.findOne({ shopId, userId }).select("_id"),
            ShopFollower_1.default.countDocuments({ shopId }),
        ]);
        return { ok: true, isFollowing: !!doc, followersCount };
    }
    static async followersCount(shopId) {
        const count = await ShopFollower_1.default.countDocuments({ shopId });
        await ShopModel_1.default.findByIdAndUpdate(shopId, { followCount: count });
        return { ok: true, count };
    }
    // Lấy trạng thái shop của user
    static async getShopStatusByUserId(userId) {
        try {
            const shop = await ShopModel_1.default.findOne({ userId })
                .select("status name slug")
                .lean();
            if (!shop) {
                return {
                    ok: true,
                    shopStatus: "not_registered",
                    shop: null,
                };
            }
            // Map backend status to frontend status
            let shopStatus;
            switch (shop.status) {
                case "pending":
                    shopStatus = "pending_review";
                    break;
                case "active":
                    shopStatus = "active";
                    break;
                case "blocked":
                    shopStatus = "blocked";
                    break;
                default:
                    shopStatus = "pending_review";
            }
            return {
                ok: true,
                shopStatus,
                shop: {
                    id: shop._id.toString(),
                    name: shop.name,
                    slug: shop.slug,
                    status: shop.status,
                },
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
    // Approve shop (admin only)
    static async approveShop(id) {
        try {
            const item = await ShopModel_1.default.findByIdAndUpdate(id, { status: "active" }, { new: true });
            if (!item) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            return { ok: true, item };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    // Reject shop (admin only)
    static async rejectShop(id) {
        try {
            const item = await ShopModel_1.default.findByIdAndUpdate(id, { status: "blocked" }, { new: true });
            if (!item) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            return { ok: true, item };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    // Suspend shop (admin only)
    static async suspendShop(id) {
        try {
            const item = await ShopModel_1.default.findByIdAndUpdate(id, { status: "blocked" }, { new: true });
            if (!item) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            return { ok: true, item };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
}
exports.default = ShopService;
