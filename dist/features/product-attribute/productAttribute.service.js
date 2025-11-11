"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ProductAttribute_1 = __importDefault(require("../../models/ProductAttribute"));
class ProductAttributeService {
    static async get(id) {
        const item = await ProductAttribute_1.default.findById(id);
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "ProductAttribute không tồn tại",
            };
        return { ok: true, item };
    }
    static async create(data) {
        try {
            const item = await ProductAttribute_1.default.create(data);
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
        const item = await ProductAttribute_1.default.findByIdAndUpdate(id, data, { new: true });
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "ProductAttribute không tồn tại",
            };
        return { ok: true, item };
    }
    static async delete(id) {
        const item = await ProductAttribute_1.default.findByIdAndDelete(id);
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "ProductAttribute không tồn tại",
            };
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
            if (query.productId)
                filter.productId = query.productId;
            if (query.attributeTypeId)
                filter.attributeTypeId = query.attributeTypeId;
            const [items, total] = await Promise.all([
                ProductAttribute_1.default.find(filter)
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }),
                ProductAttribute_1.default.countDocuments(filter),
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
exports.default = ProductAttributeService;
