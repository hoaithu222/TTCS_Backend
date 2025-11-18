"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoriesController = exports.getSubCategoriesController = exports.deleteCategoryController = exports.updateCategoryController = exports.createCategoryController = exports.getCategoryController = void 0;
const category_service_1 = __importDefault(require("./category.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getCategoryController = async (req, res) => {
    const { id } = req.params;
    const result = await category_service_1.default.getCategory(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.category);
};
exports.getCategoryController = getCategoryController;
const createCategoryController = async (req, res) => {
    // Kiểm tra quyền admin
    const currentUser = req.currentUser;
    if (!currentUser || currentUser.role !== "admin") {
        return response_util_1.ResponseUtil.error(res, "Bạn không có quyền tạo danh mục", 403);
    }
    const result = await category_service_1.default.createCategory(req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.category);
};
exports.createCategoryController = createCategoryController;
const updateCategoryController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser || currentUser.role !== "admin") {
        return response_util_1.ResponseUtil.error(res, "Bạn không có quyền cập nhật danh mục", 403);
    }
    const { id } = req.params;
    const result = await category_service_1.default.updateCategory(id, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.category);
};
exports.updateCategoryController = updateCategoryController;
const deleteCategoryController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser || currentUser.role !== "admin") {
        return response_util_1.ResponseUtil.error(res, "Bạn không có quyền xóa danh mục", 403);
    }
    const { id } = req.params;
    const result = await category_service_1.default.deleteCategory(id);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.category);
};
exports.deleteCategoryController = deleteCategoryController;
const getSubCategoriesController = async (req, res) => {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const result = await category_service_1.default.getSubCategories(id, page, limit);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.subCategories, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.getSubCategoriesController = getSubCategoriesController;
const getCategoriesController = async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const search = req.query.search;
    const isActive = req.query.isActive !== undefined
        ? String(req.query.isActive) === "true"
        : undefined;
    const result = await category_service_1.default.getCategories(page, limit, search, isActive);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.categories, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.getCategoriesController = getCategoriesController;
