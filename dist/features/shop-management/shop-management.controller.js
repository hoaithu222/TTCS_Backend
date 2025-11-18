"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyShopFollowersController = exports.getMyShopReviewsController = exports.getMyShopAnalyticsController = exports.updateMyShopOrderStatusController = exports.getMyShopOrderController = exports.getMyShopOrdersController = exports.deleteMyShopProductController = exports.getMyShopProductController = exports.updateMyShopProductController = exports.createMyShopProductController = exports.getMyShopProductsController = exports.updateMyShopController = exports.getMyShopController = void 0;
const shop_management_service_1 = __importDefault(require("./shop-management.service"));
const response_util_1 = require("../../shared/utils/response.util");
// Lấy thông tin shop của user hiện tại
const getMyShopController = async (req, res) => {
    const result = await shop_management_service_1.default.getMyShop(req);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.shop);
};
exports.getMyShopController = getMyShopController;
// Cập nhật thông tin shop
const updateMyShopController = async (req, res) => {
    const result = await shop_management_service_1.default.updateMyShop(req, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.shop);
};
exports.updateMyShopController = updateMyShopController;
// Lấy danh sách sản phẩm của shop
const getMyShopProductsController = async (req, res) => {
    const query = req.query;
    const result = await shop_management_service_1.default.getMyShopProducts(req, query);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.products, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.getMyShopProductsController = getMyShopProductsController;
// Tạo sản phẩm mới
const createMyShopProductController = async (req, res) => {
    const result = await shop_management_service_1.default.createMyShopProduct(req, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.created(res, result.product);
};
exports.createMyShopProductController = createMyShopProductController;
// Cập nhật sản phẩm
const updateMyShopProductController = async (req, res) => {
    const { productId } = req.params;
    const result = await shop_management_service_1.default.updateMyShopProduct(req, productId, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.product);
};
exports.updateMyShopProductController = updateMyShopProductController;
// Lấy chi tiết một sản phẩm của shop
const getMyShopProductController = async (req, res) => {
    const { productId } = req.params;
    const result = await shop_management_service_1.default.getMyShopProduct(req, productId);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.product);
};
exports.getMyShopProductController = getMyShopProductController;
// Xóa sản phẩm
const deleteMyShopProductController = async (req, res) => {
    const { productId } = req.params;
    const result = await shop_management_service_1.default.deleteMyShopProduct(req, productId);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.product);
};
exports.deleteMyShopProductController = deleteMyShopProductController;
// Lấy danh sách đơn hàng của shop
const getMyShopOrdersController = async (req, res) => {
    const query = req.query;
    const result = await shop_management_service_1.default.getMyShopOrders(req, query);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.orders, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.getMyShopOrdersController = getMyShopOrdersController;
// Lấy chi tiết đơn hàng
const getMyShopOrderController = async (req, res) => {
    const { orderId } = req.params;
    const result = await shop_management_service_1.default.getMyShopOrder(req, orderId);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.order);
};
exports.getMyShopOrderController = getMyShopOrderController;
// Cập nhật trạng thái đơn hàng
const updateMyShopOrderStatusController = async (req, res) => {
    const { orderId } = req.params;
    const data = req.body;
    const result = await shop_management_service_1.default.updateMyShopOrderStatus(req, orderId, data);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.order);
};
exports.updateMyShopOrderStatusController = updateMyShopOrderStatusController;
// Lấy thống kê shop
const getMyShopAnalyticsController = async (req, res) => {
    const query = req.query;
    const result = await shop_management_service_1.default.getMyShopAnalytics(req, query);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.analytics);
};
exports.getMyShopAnalyticsController = getMyShopAnalyticsController;
// Lấy đánh giá shop
const getMyShopReviewsController = async (req, res) => {
    const query = req.query;
    const result = await shop_management_service_1.default.getMyShopReviews(req, query);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
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
exports.getMyShopReviewsController = getMyShopReviewsController;
// Lấy danh sách người theo dõi
const getMyShopFollowersController = async (req, res) => {
    const query = req.query;
    const result = await shop_management_service_1.default.getMyShopFollowers(req, query);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.followers, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.getMyShopFollowersController = getMyShopFollowersController;
