import { Router } from "express";
import {
  getUserStatisticsController,
  getProductStatisticsController,
} from "./admin.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const adminRouter = Router();

// User statistics (admin only)
adminRouter.get(
  "/users/statistics",
  authenticateToken,
  authorize(["admin"]),
  getUserStatisticsController
);

// Product statistics (admin only)
adminRouter.get(
  "/products/statistics",
  authenticateToken,
  authorize(["admin"]),
  getProductStatisticsController
);

export default adminRouter;

