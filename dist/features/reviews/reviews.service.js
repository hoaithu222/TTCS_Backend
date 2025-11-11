"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ReviewModel_1 = __importDefault(require("../../models/ReviewModel"));
class ReviewsService {
    static async create(req, data) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        try {
            const review = await ReviewModel_1.default.create({
                userId,
                productId: data.productId,
                shopId: data.shopId,
                rating: data.rating,
                comment: data.comment,
                images: data.images || [],
            });
            return { ok: true, review };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    static async get(id) {
        const review = await ReviewModel_1.default.findById(id);
        if (!review)
            return {
                ok: false,
                status: 404,
                message: "Review không tồn tại",
            };
        return { ok: true, review };
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
            if (query.productId)
                filter.productId = query.productId;
            if (query.shopId)
                filter.shopId = query.shopId;
            if (query.userId)
                filter.userId = query.userId;
            const sortField = query.sortBy || "createdAt";
            const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
            const sort = { [sortField]: sortDir };
            const [items, total] = await Promise.all([
                ReviewModel_1.default.find(filter).skip(skip).limit(limit).sort(sort),
                ReviewModel_1.default.countDocuments(filter),
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
    static async update(req, id, data) {
        const currentUser = req.currentUser;
        const review = await ReviewModel_1.default.findById(id);
        if (!review)
            return {
                ok: false,
                status: 404,
                message: "Review không tồn tại",
            };
        if (review.userId.toString() !== currentUser.id.toString())
            return { ok: false, status: 403, message: "Forbidden" };
        const updated = await ReviewModel_1.default.findByIdAndUpdate(id, data, {
            new: true,
        });
        return { ok: true, review: updated };
    }
    static async delete(req, id) {
        const currentUser = req.currentUser;
        const review = await ReviewModel_1.default.findById(id);
        if (!review)
            return {
                ok: false,
                status: 404,
                message: "Review không tồn tại",
            };
        if (review.userId.toString() !== currentUser.id.toString())
            return { ok: false, status: 403, message: "Forbidden" };
        const deleted = await ReviewModel_1.default.findByIdAndDelete(id);
        return { ok: true, review: deleted };
    }
}
exports.default = ReviewsService;
