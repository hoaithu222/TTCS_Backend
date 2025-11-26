"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const AttributeType_1 = __importDefault(require("../../models/AttributeType"));
const AttributeValue_1 = __importDefault(require("../../models/AttributeValue"));
const slugify_1 = require("../../shared/utils/slugify");
const INPUT_TYPES = ["text", "number", "select", "multiselect", "boolean", "date", "color"];
function normalizeInputType(inputType, isMultiple) {
    if (inputType && INPUT_TYPES.includes(inputType))
        return inputType;
    if (isMultiple)
        return "multiselect";
    return "select";
}
function normalizeCategoryIds(categoryId, categoryIds) {
    const ids = Array.isArray(categoryIds)
        ? categoryIds.filter((id) => typeof id === "string" && id.trim().length > 0)
        : [];
    if (categoryId && !ids.includes(categoryId)) {
        ids.unshift(categoryId);
    }
    const deduped = Array.from(new Set(ids));
    const primaryCategoryId = deduped[0] || categoryId || undefined;
    return {
        primaryCategoryId,
        categoryIds: deduped,
    };
}
function normalizeAttributeCode(name, code) {
    const resolvedCode = (0, slugify_1.slugify)(code || name, { separator: "_" });
    if (!resolvedCode)
        throw new Error("Thiếu mã hệ thống cho thuộc tính (code).");
    return resolvedCode;
}
function normalizeAttributeValues(values) {
    if (!Array.isArray(values))
        return [];
    return values
        .map((value) => ({
        value: value.value?.trim(),
        label: value.label?.trim() || value.value?.trim() || "",
        colorCode: value.colorCode,
        sortOrder: value.sortOrder ?? 0,
        isActive: value.isActive ?? true,
    }))
        .filter((item) => !!item.value);
}
class AttributeTypeService {
    static async get(id) {
        const item = await AttributeType_1.default.findById(id)
            .populate("categoryId", "name")
            .populate("categoryIds", "name");
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
            const { values, code, name, ...typeData } = data;
            const normalizedCode = normalizeAttributeCode(name, code);
            const normalizedName = name || (0, slugify_1.humanizeCode)(normalizedCode);
            const { primaryCategoryId, categoryIds } = normalizeCategoryIds(typeData.categoryId, typeData.categoryIds);
            if (categoryIds.length > 0) {
                const existing = await AttributeType_1.default.findOne({
                    code: normalizedCode,
                    categoryIds: { $in: categoryIds },
                });
                if (existing) {
                    return {
                        ok: false,
                        status: 409,
                        message: `Mã thuộc tính "${normalizedCode}" đã tồn tại trong một trong các danh mục đã chọn.`,
                    };
                }
            }
            const item = await AttributeType_1.default.create({
                ...typeData,
                categoryId: primaryCategoryId,
                categoryIds,
                name: normalizedName,
                code: normalizedCode,
                inputType: normalizeInputType(typeData.inputType, typeData.is_multiple),
            });
            // Create values if provided
            const normalizedValues = normalizeAttributeValues(values);
            if (normalizedValues.length > 0) {
                const valueDocs = normalizedValues.map((v) => ({
                    attributeTypeId: item._id,
                    ...v,
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
        const current = await AttributeType_1.default.findById(id);
        if (!current) {
            return {
                ok: false,
                status: 404,
                message: "AttributeType không tồn tại",
            };
        }
        const { primaryCategoryId, categoryIds } = normalizeCategoryIds(data.categoryId ?? current.categoryId?.toString(), data.categoryIds ?? current.categoryIds?.map((id) => id?.toString()));
        const updatePayload = { ...data };
        updatePayload.categoryId = primaryCategoryId;
        updatePayload.categoryIds = categoryIds;
        if (data.code || data.name) {
            updatePayload.code = normalizeAttributeCode(data.name, data.code);
            if (!data.name) {
                updatePayload.name = (0, slugify_1.humanizeCode)(updatePayload.code);
            }
            const existing = await AttributeType_1.default.findOne({
                _id: { $ne: id },
                code: updatePayload.code,
                categoryIds: { $in: categoryIds.length ? categoryIds : current.categoryIds },
            });
            if (existing) {
                return {
                    ok: false,
                    status: 409,
                    message: `Mã thuộc tính "${updatePayload.code}" đã tồn tại trong danh mục này.`,
                };
            }
        }
        if (data.inputType || data.is_multiple !== undefined) {
            updatePayload.inputType = normalizeInputType(data.inputType, data.is_multiple);
        }
        if (data.values) {
            const normalizedValues = normalizeAttributeValues(data.values);
            if (normalizedValues.length > 0) {
                await AttributeValue_1.default.deleteMany({ attributeTypeId: id });
                await AttributeValue_1.default.insertMany(normalizedValues.map((value) => ({ attributeTypeId: id, ...value })));
            }
            delete updatePayload.values;
        }
        const item = await AttributeType_1.default.findByIdAndUpdate(id, updatePayload, {
            new: true,
            runValidators: true,
        })
            .populate("categoryId", "name")
            .populate("categoryIds", "name");
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
            if (query.categoryId) {
                filter.categoryIds = query.categoryId;
            }
            else if (Array.isArray(query.categoryIds) && query.categoryIds.length > 0) {
                filter.categoryIds = { $in: query.categoryIds };
            }
            const [items, total] = await Promise.all([
                AttributeType_1.default.find(filter)
                    .populate("categoryId", "name")
                    .populate("categoryIds", "name")
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
    static async listByCategory(categoryId) {
        if (!categoryId || !mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            return {
                ok: false,
                status: 400,
                message: "categoryId không hợp lệ",
            };
        }
        const categoryObjectId = new mongoose_1.default.Types.ObjectId(categoryId);
        const attributeTypes = await AttributeType_1.default.find({
            isActive: true,
            $or: [{ categoryId: categoryObjectId }, { categoryIds: categoryObjectId }],
        })
            .sort({ displayOrder: 1, createdAt: -1 })
            .lean();
        const attributeTypeIds = attributeTypes.map((attr) => attr._id);
        const values = attributeTypeIds.length
            ? await AttributeValue_1.default.find({
                attributeTypeId: { $in: attributeTypeIds },
                isActive: true,
            })
                .sort({ sortOrder: 1, createdAt: 1 })
                .lean()
            : [];
        const valueMap = values.reduce((acc, value) => {
            const key = value.attributeTypeId?.toString();
            if (!key)
                return acc;
            if (!acc[key])
                acc[key] = [];
            acc[key].push({
                id: value._id.toString(),
                _id: value._id.toString(),
                value: value.value,
                label: value.label || value.value,
                colorCode: value.colorCode,
                sortOrder: value.sortOrder ?? 0,
            });
            return acc;
        }, {});
        const items = attributeTypes.map((attr) => ({
            id: attr._id.toString(),
            _id: attr._id.toString(),
            name: attr.name,
            code: attr.code,
            description: attr.description,
            helperText: attr.helperText,
            inputType: attr.inputType || (attr.is_multiple ? "multiselect" : "select"),
            isVariantAttribute: attr.isVariantAttribute ?? true,
            categoryId: attr.categoryId?.toString(),
            categoryIds: Array.isArray(attr.categoryIds)
                ? attr.categoryIds.map((id) => id?.toString()).filter(Boolean)
                : [],
            values: valueMap[attr._id.toString()] || [],
        }));
        return { ok: true, items };
    }
}
exports.default = AttributeTypeService;
