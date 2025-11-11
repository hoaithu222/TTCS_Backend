"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CategoryModel_1 = __importDefault(require("../../models/CategoryModel"));
const SubCategoryModel_1 = __importDefault(require("../../models/SubCategoryModel"));
class CategoryService {
    static async getCategory(id) {
        const category = await CategoryModel_1.default.findById(id);
        if (!category) {
            return {
                ok: false,
                status: 400,
                message: "Category không tồn tại",
            };
        }
        return { ok: true, category };
    }
    static async createCategory(data) {
        try {
            const category = await CategoryModel_1.default.create(data);
            return { ok: true, category };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    static async updateCategory(id, data) {
        const category = await CategoryModel_1.default.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (!category) {
            return {
                ok: false,
                status: 404,
                message: "Category không tồn tại",
            };
        }
        return { ok: true, category };
    }
    static async deleteCategory(id) {
        const category = await CategoryModel_1.default.findByIdAndDelete(id);
        if (!category) {
            return {
                ok: false,
                status: 404,
                message: "Category không tồn tại",
            };
        }
        return { ok: true, category };
    }
    static async getCategories(page = 1, limit = 10, search, isActive) {
        try {
            const safePage = Number.isFinite(page) && page > 0 ? page : 1;
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
            const skip = (safePage - 1) * safeLimit;
            // Build filter query
            const filterQuery = {};
            // Add search filter (case insensitive)
            if (search && search.trim()) {
                filterQuery.name = { $regex: search.trim(), $options: "i" };
            }
            // Add isActive filter
            if (isActive !== undefined) {
                filterQuery.isActive = isActive;
            }
            const [categories, total] = await Promise.all([
                CategoryModel_1.default.find(filterQuery)
                    .skip(skip)
                    .limit(safeLimit)
                    .sort({ order_display: 1, createdAt: -1 }),
                CategoryModel_1.default.countDocuments(filterQuery),
            ]);
            return {
                ok: true,
                categories,
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
    // lấy danh sách sub category với id category
    static async getSubCategories(id, page = 1, limit = 10) {
        try {
            const safePage = Number.isFinite(page) && page > 0 ? page : 1;
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
            const skip = (safePage - 1) * safeLimit;
            const [subCategories, total] = await Promise.all([
                SubCategoryModel_1.default.find({ categoryId: id })
                    .skip(skip)
                    .limit(safeLimit)
                    .sort({ order_display: 1, createdAt: -1 }),
                SubCategoryModel_1.default.countDocuments({ categoryId: id }),
            ]);
            return {
                ok: true,
                subCategories,
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
}
exports.default = CategoryService;
