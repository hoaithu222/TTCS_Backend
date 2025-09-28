import { Router } from "express";
import {
  shopRevenueController,
  adminRevenueController,
  revenueTimeSeriesController,
  topProductsController,
  topShopsController,
  orderStatusDistributionController,
  averageOrderValueController,
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

export default analyticsRouter;
