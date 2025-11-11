"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
const ShopFollower_1 = __importDefault(require("../../models/ShopFollower"));
class ShopService {
    static async get(id) {
        const item = await ShopModel_1.default.findById(id);
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
        const shop = await ShopModel_1.default.findById(shopId).select("_id followCount");
        if (!shop)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        try {
            await ShopFollower_1.default.create({ shopId, userId });
            await ShopModel_1.default.findByIdAndUpdate(shopId, { $inc: { followCount: 1 } });
            return { ok: true };
        }
        catch (error) {
            // Duplicate follows should be idempotent
            if (error.code === 11000) {
                return { ok: true };
            }
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    static async unfollow(shopId, userId) {
        const shop = await ShopModel_1.default.findById(shopId).select("_id followCount");
        if (!shop)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        const res = await ShopFollower_1.default.findOneAndDelete({ shopId, userId });
        if (res) {
            await ShopModel_1.default.findByIdAndUpdate(shopId, { $inc: { followCount: -1 } });
        }
        return { ok: true };
    }
    static async isFollowing(shopId, userId) {
        const doc = await ShopFollower_1.default.findOne({ shopId, userId }).select("_id");
        return { ok: true, following: !!doc };
    }
    static async followersCount(shopId) {
        const count = await ShopFollower_1.default.countDocuments({ shopId });
        return { ok: true, count };
    }
}
exports.default = ShopService;
