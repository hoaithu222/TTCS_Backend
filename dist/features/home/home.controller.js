"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchSuggestionsController = exports.getFlashSaleProductsController = exports.getBestShopsController = exports.getBestSellerProductsController = exports.getHomeCategoriesController = exports.getBannerController = void 0;
const home_service_1 = __importDefault(require("./home.service"));
const response_util_1 = require("../../shared/utils/response.util");
const getBannerController = async (req, res) => {
    const result = await home_service_1.default.getBanner();
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message || "Failed to fetch banners", result.status || 500);
    }
    return response_util_1.ResponseUtil.success(res, result.banners);
};
exports.getBannerController = getBannerController;
const getHomeCategoriesController = async (req, res) => {
    const { page, limit } = req.query;
    const result = await home_service_1.default.getHomeCategories({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { categories: result.categories }, "Success", 200, 1, result.pagination);
};
exports.getHomeCategoriesController = getHomeCategoriesController;
const getBestSellerProductsController = async (req, res) => {
    const { page, limit } = req.query;
    const result = await home_service_1.default.getBestSellerProducts({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { products: result.products }, "Success", 200, 1, result.pagination);
};
exports.getBestSellerProductsController = getBestSellerProductsController;
const getBestShopsController = async (req, res) => {
    const { page, limit } = req.query;
    const result = await home_service_1.default.getBestShops({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { shops: result.shops }, "Success", 200, 1, result.pagination);
};
exports.getBestShopsController = getBestShopsController;
const getFlashSaleProductsController = async (req, res) => {
    const { page, limit } = req.query;
    const result = await home_service_1.default.getFlashSaleProducts({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { products: result.products }, "Success", 200, 1, result.pagination);
};
exports.getFlashSaleProductsController = getFlashSaleProductsController;
const getSearchSuggestionsController = async (req, res) => {
    const { q, page, limit } = req.query;
    if (!q) {
        return response_util_1.ResponseUtil.error(res, "Query parameter 'q' is required", 400);
    }
    const result = await home_service_1.default.getSearchSuggestions({
        q: String(q),
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { products: result.products }, "Success", 200, 1, result.pagination);
};
exports.getSearchSuggestionsController = getSearchSuggestionsController;
