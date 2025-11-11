"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SubCategoryModel_1 = __importDefault(require("../../models/SubCategoryModel"));
class SubCategoryService {
    static async getSubCategory(id) {
        const subCategory = await SubCategoryModel_1.default.findById(id);
        if (!subCategory) {
            return {
                ok: false,
                status: 404,
                message: "SubCategory không tồn tại",
            };
        }
        return { ok: true, subCategory };
    }
    static async createSubCategory(data) {
        try {
            const subCategory = await SubCategoryModel_1.default.create(data);
            return { ok: true, subCategory };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    static async updateSubCategory(id, data) {
        const subCategory = await SubCategoryModel_1.default.findByIdAndUpdate(id, data, { new: true });
        if (!subCategory) {
            return {
                ok: false,
                status: 404,
                message: "SubCategory không tồn tại",
            };
        }
        return { ok: true, subCategory };
    }
    static async deleteSubCategory(id) {
        const subCategory = await SubCategoryModel_1.default.findByIdAndDelete(id);
        if (!subCategory) {
            return {
                ok: false,
                status: 404,
                message: "SubCategory không tồn tại",
            };
        }
        return { ok: true, subCategory };
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
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (typeof query.isActive === "boolean")
                filter.isActive = query.isActive;
            if (query.search)
                filter.name = { $regex: query.search, $options: "i" };
            const [items, total] = await Promise.all([
                SubCategoryModel_1.default.find(filter)
                    .skip(skip)
                    .limit(limit)
                    .sort({ order_display: 1, createdAt: -1 }),
                SubCategoryModel_1.default.countDocuments(filter),
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
}
exports.default = SubCategoryService;
