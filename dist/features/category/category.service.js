"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        // Fetch attributes for this category
        const AttributeTypeModel = (await Promise.resolve().then(() => __importStar(require("../../models/AttributeType")))).default;
        const AttributeValueModel = (await Promise.resolve().then(() => __importStar(require("../../models/AttributeValue")))).default;
        const attributeTypes = await AttributeTypeModel.find({ categoryId: id, isActive: true });
        // Populate values for each attribute type
        const attributesWithValues = await Promise.all(attributeTypes.map(async (attrType) => {
            const values = await AttributeValueModel.find({
                attributeTypeId: attrType._id,
            });
            return {
                id: attrType._id.toString(),
                _id: attrType._id.toString(),
                name: attrType.name,
                description: attrType.description,
                inputType: attrType.is_multiple ? "multiselect" : "select",
                isRequired: false, // Default, can be added to schema later
                values: values.map((val) => ({
                    id: val._id.toString(),
                    _id: val._id.toString(),
                    value: val.value,
                    label: val.value,
                    colorCode: val.colorCode || undefined,
                })),
            };
        }));
        // Convert category to plain object and add attributes
        const categoryObj = category.toObject ? category.toObject() : category;
        categoryObj.attributes = attributesWithValues;
        return { ok: true, category: categoryObj };
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
    static async getCategories(page = 1, limit = 50, search, isActive) {
        try {
            const safePage = Number.isFinite(page) && page > 0 ? page : 1;
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 50;
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
    static async getSubCategories(id, page = 1, limit = 50) {
        try {
            const safePage = Number.isFinite(page) && page > 0 ? page : 1;
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 50;
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
