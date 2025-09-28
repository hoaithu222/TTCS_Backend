import { Router } from "express";
import {
  shopRevenueController,
  adminRevenueController,
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

export default analyticsRouter;
