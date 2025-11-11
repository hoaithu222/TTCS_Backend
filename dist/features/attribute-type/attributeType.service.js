"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AttributeType_1 = __importDefault(require("../../models/AttributeType"));
const AttributeValue_1 = __importDefault(require("../../models/AttributeValue"));
class AttributeTypeService {
    static async get(id) {
        const item = await AttributeType_1.default.findById(id).populate("categoryId", "name");
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "AttributeType không tồn tại",
            };
        return { ok: true, item };
    }
    static async create(data) {
        try {
            const { values, ...typeData } = data;
            const item = await AttributeType_1.default.create(typeData);
            // Create values if provided
            if (values && Array.isArray(values) && values.length > 0) {
                const valueDocs = values.map((v) => ({
                    attributeTypeId: item._id,
                    value: v.value,
                }));
                await AttributeValue_1.default.insertMany(valueDocs);
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
    static async update(id, data) {
        const item = await AttributeType_1.default.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "AttributeType không tồn tại",
            };
        return { ok: true, item };
    }
    static async delete(id) {
        const item = await AttributeType_1.default.findByIdAndDelete(id);
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "AttributeType không tồn tại",
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
            if (query.isActive !== undefined)
                filter.isActive = query.isActive;
            if (query.search)
                filter.name = { $regex: query.search, $options: "i" };
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            const [items, total] = await Promise.all([
                AttributeType_1.default.find(filter)
                    .populate("categoryId", "name")
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }),
                AttributeType_1.default.countDocuments(filter),
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
exports.default = AttributeTypeService;
