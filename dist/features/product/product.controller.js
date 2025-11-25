"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductReviewController = exports.getProductReviewsController = exports.trackProductViewController = exports.getRelatedProductsController = exports.getRecommendedProductsController = exports.getFeaturedProductsController = exports.searchProductController = exports.listProductController = exports.deleteProductController = exports.updateProductController = exports.createProductController = exports.getProductController = void 0;
const product_service_1 = __importDefault(require("./product.service"));
const reviews_service_1 = __importDefault(require("../reviews/reviews.service"));
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
        limit: Number(limit) || 50,
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
const searchProductController = async (req, res) => {
    const { page, limit, categoryId, subCategoryId, shopId, search, minPrice, maxPrice, sortBy, sortOrder, } = req.query;
    const result = await product_service_1.default.search({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        categoryId,
        subCategoryId,
        shopId,
        search,
        minPrice: minPrice != null ? Number(minPrice) : undefined,
        maxPrice: maxPrice != null ? Number(maxPrice) : undefined,
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
exports.searchProductController = searchProductController;
const getFeaturedProductsController = async (req, res) => {
    const { page, limit, categoryId, subCategoryId, shopId, } = req.query;
    const result = await product_service_1.default.getFeatured({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        categoryId,
        subCategoryId,
        shopId,
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
exports.getFeaturedProductsController = getFeaturedProductsController;
const getRecommendedProductsController = async (req, res) => {
    const { page, limit, categoryId, subCategoryId, shopId, } = req.query;
    const result = await product_service_1.default.getRecommended({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        categoryId,
        subCategoryId,
        shopId,
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
exports.getRecommendedProductsController = getRecommendedProductsController;
const getRelatedProductsController = async (req, res) => {
    const { id } = req.params;
    const { limit } = req.query;
    const result = await product_service_1.default.getRelated(id, limit ? Number(limit) : 8);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items);
};
exports.getRelatedProductsController = getRelatedProductsController;
const trackProductViewController = async (req, res) => {
    const { id } = req.params;
    const result = await product_service_1.default.trackView(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, {});
};
exports.trackProductViewController = trackProductViewController;
const getProductReviewsController = async (req, res) => {
    const { id } = req.params;
    const { page, limit, sortBy } = req.query;
    const result = await product_service_1.default.getReviews(id, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, {
        reviews: result.reviews,
        averageRating: result.averageRating,
        totalReviews: result.totalReviews,
        ratingDistribution: result.ratingDistribution,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
        },
    });
};
exports.getProductReviewsController = getProductReviewsController;
const createProductReviewController = async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const result = await reviews_service_1.default.create(req, {
        ...payload,
        productId: id,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.review);
};
exports.createProductReviewController = createProductReviewController;
