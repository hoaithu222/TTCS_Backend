"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const analyticsRouter = (0, express_1.Router)();
// Admin overall revenue stats
analyticsRouter.get("/admin/revenue", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), analytics_controller_1.adminRevenueController);
// Shop specific revenue stats
analyticsRouter.get("/shops/:shopId/revenue", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "shop"]), analytics_controller_1.shopRevenueController);
// Revenue time series for charts
analyticsRouter.get("/timeseries/revenue", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "shop"]), analytics_controller_1.revenueTimeSeriesController);
// Top products by revenue/quantity
analyticsRouter.get("/top/products", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "shop"]), analytics_controller_1.topProductsController);
// Top products for a specific shop (convenience route)
analyticsRouter.get("/shops/:shopId/top-products", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "shop"]), (req, res, next) => {
    // inject shopId param into query for controller reuse
    req.query.shopId = req.params.shopId;
    return (0, analytics_controller_1.topProductsController)(req, res).catch(next);
});
// Top shops by revenue
analyticsRouter.get("/top/shops", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), analytics_controller_1.topShopsController);
// Order status distribution pie chart
analyticsRouter.get("/orders/status-distribution", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), analytics_controller_1.orderStatusDistributionController);
// Average order value
analyticsRouter.get("/orders/aov", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "shop"]), analytics_controller_1.averageOrderValueController);
exports.default = analyticsRouter;
