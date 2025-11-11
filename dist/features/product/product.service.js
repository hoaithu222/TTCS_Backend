"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
class ProductService {
    static async get(id) {
        const product = await ProductModal_1.default.findById(id);
        if (!product)
            return {
                ok: false,
                status: 404,
                message: "Product không tồn tại",
            };
        return { ok: true, product };
    }
    static async create(data) {
        try {
            const product = await ProductModal_1.default.create(data);
            return { ok: true, product };
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
        const product = await ProductModal_1.default.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (!product)
            return {
                ok: false,
                status: 404,
                message: "Product không tồn tại",
            };
        return { ok: true, product };
    }
    static async delete(id) {
        const product = await ProductModal_1.default.findByIdAndDelete(id);
        if (!product)
            return {
                ok: false,
                status: 404,
                message: "Product không tồn tại",
            };
        return { ok: true, product };
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
            if (typeof query.isActive === "boolean")
                filter.isActive = query.isActive;
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (query.subCategoryId)
                filter.subCategoryId = query.subCategoryId;
            if (query.shopId)
                filter.shopId = query.shopId;
            if (query.minPrice != null || query.maxPrice != null) {
                filter.price = {};
                if (query.minPrice != null)
                    filter.price.$gte = query.minPrice;
                if (query.maxPrice != null)
                    filter.price.$lte = query.maxPrice;
            }
            if (query.search)
                filter.$text = { $search: query.search };
            const sortField = query.sortBy || "createdAt";
            const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
            const sort = { [sortField]: sortDir };
            const [items, total] = await Promise.all([
                ProductModal_1.default.find(filter).skip(skip).limit(limit).sort(sort),
                ProductModal_1.default.countDocuments(filter),
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
exports.default = ProductService;
