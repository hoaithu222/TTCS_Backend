"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemLoadStatsController = exports.paymentAndDeviceDistributionController = exports.cashFlowGrowthController = exports.shopStrengthQuadrantController = exports.averageOrderValueController = exports.orderStatusDistributionController = exports.topShopsController = exports.topProductsController = exports.revenueTimeSeriesController = exports.adminRevenueController = exports.shopRevenueController = void 0;
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
// 1. Shop Strength Quadrant
const shopStrengthQuadrantController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const period = req.query.period || undefined;
    // Calculate date range based on period if not provided
    let dateFrom = from;
    let dateTo = to;
    if (!dateFrom && !dateTo && period) {
        const now = new Date();
        dateTo = new Date(now);
        dateFrom = new Date(now);
        switch (period) {
            case "day":
                dateFrom.setDate(dateFrom.getDate() - 1);
                break;
            case "week":
                dateFrom.setDate(dateFrom.getDate() - 7);
                break;
            case "month":
                dateFrom.setMonth(dateFrom.getMonth() - 1);
                break;
            case "year":
                dateFrom.setFullYear(dateFrom.getFullYear() - 1);
                break;
        }
    }
    const result = await analytics_service_1.default.shopStrengthQuadrant({ from: dateFrom, to: dateTo });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items);
};
exports.shopStrengthQuadrantController = shopStrengthQuadrantController;
// 2. Cash Flow Growth with MA30 and Net Profit
const cashFlowGrowthController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const period = req.query.period || undefined;
    const granularity = req.query.granularity ||
        (period === "year" ? "month" : "day");
    // Calculate date range based on period if not provided
    let dateFrom = from;
    let dateTo = to;
    if (!dateFrom && !dateTo && period) {
        const now = new Date();
        dateTo = new Date(now);
        dateFrom = new Date(now);
        switch (period) {
            case "day":
                dateFrom.setDate(dateFrom.getDate() - 1);
                break;
            case "week":
                dateFrom.setDate(dateFrom.getDate() - 7);
                break;
            case "month":
                dateFrom.setMonth(dateFrom.getMonth() - 1);
                break;
            case "year":
                dateFrom.setFullYear(dateFrom.getFullYear() - 1);
                break;
        }
    }
    const result = await analytics_service_1.default.cashFlowGrowth({
        from: dateFrom,
        to: dateTo,
        granularity,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items);
};
exports.cashFlowGrowthController = cashFlowGrowthController;
// 3. Payment Method & Device Type Distribution
const paymentAndDeviceDistributionController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const period = req.query.period || undefined;
    // Calculate date range based on period if not provided
    let dateFrom = from;
    let dateTo = to;
    if (!dateFrom && !dateTo && period) {
        const now = new Date();
        dateTo = new Date(now);
        dateFrom = new Date(now);
        switch (period) {
            case "day":
                dateFrom.setDate(dateFrom.getDate() - 1);
                break;
            case "week":
                dateFrom.setDate(dateFrom.getDate() - 7);
                break;
            case "month":
                dateFrom.setMonth(dateFrom.getMonth() - 1);
                break;
            case "year":
                dateFrom.setFullYear(dateFrom.getFullYear() - 1);
                break;
        }
    }
    const result = await analytics_service_1.default.paymentAndDeviceDistribution({
        from: dateFrom,
        to: dateTo,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, {
        paymentMethods: result.paymentMethods,
        deviceTypes: result.deviceTypes,
    });
};
exports.paymentAndDeviceDistributionController = paymentAndDeviceDistributionController;
// 4. System Load Stats (API Request Tracking)
const systemLoadStatsController = async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const period = req.query.period || undefined;
    const granularity = req.query.granularity ||
        (period === "year" || period === "month" ? "day" : "hour");
    // Calculate date range based on period if not provided
    let dateFrom = from;
    let dateTo = to;
    if (!dateFrom && !dateTo && period) {
        const now = new Date();
        dateTo = new Date(now);
        dateFrom = new Date(now);
        switch (period) {
            case "day":
                dateFrom.setDate(dateFrom.getDate() - 1);
                break;
            case "week":
                dateFrom.setDate(dateFrom.getDate() - 7);
                break;
            case "month":
                dateFrom.setMonth(dateFrom.getMonth() - 1);
                break;
            case "year":
                dateFrom.setFullYear(dateFrom.getFullYear() - 1);
                break;
        }
    }
    const result = await analytics_service_1.default.systemLoadStats({
        from: dateFrom,
        to: dateTo,
        granularity,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items);
};
exports.systemLoadStatsController = systemLoadStatsController;
