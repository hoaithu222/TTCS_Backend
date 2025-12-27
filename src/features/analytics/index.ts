import { Router } from "express";
import {
  shopRevenueController,
  adminRevenueController,
  revenueTimeSeriesController,
  topProductsController,
  topShopsController,
  orderStatusDistributionController,
  averageOrderValueController,
  shopStrengthQuadrantController,
  cashFlowGrowthController,
  paymentAndDeviceDistributionController,
  systemLoadStatsController,
} from "./analytics.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const analyticsRouter = Router();

// Admin overall revenue stats
analyticsRouter.get(
  "/admin/revenue",
  authenticateToken,
  authorize(["admin"]),
  adminRevenueController
);

// Shop specific revenue stats
analyticsRouter.get(
  "/shops/:shopId/revenue",
  authenticateToken,
  authorize(["admin", "shop"]),
  shopRevenueController
);

// Revenue time series for charts
analyticsRouter.get(
  "/timeseries/revenue",
  authenticateToken,
  authorize(["admin", "shop"]),
  revenueTimeSeriesController
);

// Top products by revenue/quantity
analyticsRouter.get(
  "/top/products",
  authenticateToken,
  authorize(["admin", "shop"]),
  topProductsController
);

// Top products for a specific shop (convenience route)
analyticsRouter.get(
  "/shops/:shopId/top-products",
  authenticateToken,
  authorize(["admin", "shop"]),
  (req, res, next) => {
    // inject shopId param into query for controller reuse
    (req.query as any).shopId = req.params.shopId;
    return topProductsController(req, res).catch(next);
  }
);

// Top shops by revenue
analyticsRouter.get(
  "/top/shops",
  authenticateToken,
  authorize(["admin"]),
  topShopsController
);

// Order status distribution pie chart
analyticsRouter.get(
  "/orders/status-distribution",
  authenticateToken,
  authorize(["admin"]),
  orderStatusDistributionController
);

// Average order value
analyticsRouter.get(
  "/orders/aov",
  authenticateToken,
  authorize(["admin", "shop"]),
  averageOrderValueController
);

// 1. Shop Strength Quadrant (Admin only)
analyticsRouter.get(
  "/admin/shop-strength",
  authenticateToken,
  authorize(["admin"]),
  shopStrengthQuadrantController
);

// 2. Cash Flow Growth with MA30 and Net Profit
analyticsRouter.get(
  "/admin/cash-flow-growth",
  authenticateToken,
  authorize(["admin"]),
  cashFlowGrowthController
);

// 3. Payment Method & Device Type Distribution
analyticsRouter.get(
  "/admin/payment-device-distribution",
  authenticateToken,
  authorize(["admin"]),
  paymentAndDeviceDistributionController
);

// 4. System Load Stats (API Request Tracking)
analyticsRouter.get(
  "/admin/system-load",
  authenticateToken,
  authorize(["admin"]),
  systemLoadStatsController
);

export default analyticsRouter;
