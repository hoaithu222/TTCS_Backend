"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProductController = exports.deleteProductController = exports.updateProductController = exports.createProductController = exports.getProductController = void 0;
const product_service_1 = __importDefault(require("./product.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getProductController = async (req, res) => {
    const { id } = req.params;
    const result = await product_service_1.default.get(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.product);
};
exports.getProductController = getProductController;
const createProductController = async (req, res) => {
    const result = await product_service_1.default.create(req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.product);
};
exports.createProductController = createProductController;
const updateProductController = async (req, res) => {
    const { id } = req.params;
    const result = await product_service_1.default.update(id, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.product);
};
exports.updateProductController = updateProductController;
const deleteProductController = async (req, res) => {
    const { id } = req.params;
    const result = await product_service_1.default.delete(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.product);
};
exports.deleteProductController = deleteProductController;
const listProductController = async (req, res) => {
    const { page, limit, categoryId, subCategoryId, shopId, search, minPrice, maxPrice, isActive, sortBy, sortOrder, } = req.query;
    const result = await product_service_1.default.list({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        categoryId,
        subCategoryId,
        shopId,
        search,
        minPrice: minPrice != null ? Number(minPrice) : undefined,
        maxPrice: maxPrice != null ? Number(maxPrice) : undefined,
        isActive: typeof isActive === "string" ? isActive === "true" : undefined,
        sortBy,
        sortOrder,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.listProductController = listProductController;
