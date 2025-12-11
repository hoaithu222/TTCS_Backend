"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSubCategoryController = exports.deleteSubCategoryController = exports.updateSubCategoryController = exports.createSubCategoryController = exports.getSubCategoryController = void 0;
const subCategory_service_1 = __importDefault(require("./subCategory.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getSubCategoryController = async (req, res) => {
    const { id } = req.params;
    const result = await subCategory_service_1.default.getSubCategory(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.subCategory);
};
exports.getSubCategoryController = getSubCategoryController;
const createSubCategoryController = async (req, res) => {
    const result = await subCategory_service_1.default.createSubCategory(req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.created(res, result.subCategory, "Tạo danh mục phụ thành công");
};
exports.createSubCategoryController = createSubCategoryController;
const updateSubCategoryController = async (req, res) => {
    const { id } = req.params;
    const result = await subCategory_service_1.default.updateSubCategory(id, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.subCategory, "Cập nhật danh mục phụ thành công");
};
exports.updateSubCategoryController = updateSubCategoryController;
const deleteSubCategoryController = async (req, res) => {
    const { id } = req.params;
    const result = await subCategory_service_1.default.deleteSubCategory(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.subCategory, "Xóa danh mục phụ thành công");
};
exports.deleteSubCategoryController = deleteSubCategoryController;
const listSubCategoryController = async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const isActive = typeof req.query.isActive === "string"
        ? req.query.isActive === "true"
        : undefined;
    const result = await subCategory_service_1.default.list({
        page,
        limit,
        categoryId,
        search,
        isActive,
    });
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.items, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.listSubCategoryController = listSubCategoryController;
