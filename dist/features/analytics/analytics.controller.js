"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.averageOrderValueController = exports.orderStatusDistributionController = exports.topShopsController = exports.topProductsController = exports.revenueTimeSeriesController = exports.adminRevenueController = exports.shopRevenueController = void 0;
const analytics_service_1 = __importDefault(require("./analytics.service"));
const response_util_1 = require("../../shared/utils/response.util");
const shopRevenueController = async (req, res) => {
    const { shopId } = req.params;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const result = await analytics_service_1.default.revenueByShop({ shopId, from, to });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.revenue);
};
exports.shopRevenueController = shopRevenueController;
const adminRevenueController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const result = await analytics_service_1.default.revenueAllShops({ from, to });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, {
        items: result.items,
        totals: result.totals,
    });
};
exports.adminRevenueController = adminRevenueController;
const revenueTimeSeriesController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const granularity = req.query.granularity || "day";
    const shopId = req.query.shopId || undefined;
    const result = await analytics_service_1.default.revenueTimeSeries({
        from,
        to,
        granularity,
        shopId,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items);
};
exports.revenueTimeSeriesController = revenueTimeSeriesController;
const topProductsController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const shopId = req.query.shopId || undefined;
    const categoryId = req.query.categoryId || undefined;
    const subCategoryId = req.query.subCategoryId || undefined;
    const metric = req.query.metric || undefined;
    const result = await analytics_service_1.default.topProducts({
        from,
        to,
        limit,
        shopId,
        categoryId,
        subCategoryId,
        metric,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items);
};
exports.topProductsController = topProductsController;
const topShopsController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await analytics_service_1.default.topShops({ from, to, limit });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    // Debug: Log để kiểm tra dữ liệu
    console.log("🔍 [TopShops Controller] Result items:", JSON.stringify(result.items, null, 2));
    return response_util_1.ResponseUtil.success(res, result.items);
};
exports.topShopsController = topShopsController;
const orderStatusDistributionController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const result = await analytics_service_1.default.orderStatusDistribution({ from, to });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items);
};
exports.orderStatusDistributionController = orderStatusDistributionController;
const averageOrderValueController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const shopId = req.query.shopId || undefined;
    const result = await analytics_service_1.default.averageOrderValue({ from, to, shopId });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result);
};
exports.averageOrderValueController = averageOrderValueController;
