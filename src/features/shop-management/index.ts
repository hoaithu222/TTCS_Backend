import { Router } from "express";
import {
  getMyShopController,
  updateMyShopController,
  getMyShopProductsController,
  getMyShopProductController,
  createMyShopProductController,
  updateMyShopProductController,
  deleteMyShopProductController,
  getMyShopOrdersController,
  getMyShopOrderController,
  updateMyShopOrderStatusController,
  getMyShopAnalyticsController,
  getMyShopReviewsController,
  getMyShopFollowersController,
  batchPrintOrdersController,
  addInternalNoteController,
  getInternalNotesController,
  deleteInternalNoteController,
  getOrderTimelineController,
} from "./shop-management.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const shopManagementRouter = Router();

// Tất cả routes đều yêu cầu authentication
// Không yêu cầu role cụ thể vì user có thể tạo shop và quản lý shop của mình
shopManagementRouter.use(authenticateToken);
// Cho phép tất cả user đã authenticated truy cập (service sẽ check shop ownership)

// Shop info
shopManagementRouter.get("/my-shop", getMyShopController);
shopManagementRouter.put("/my-shop", updateMyShopController);

// Products
shopManagementRouter.get("/my-shop/products", getMyShopProductsController);
shopManagementRouter.get("/my-shop/products/:productId", getMyShopProductController);
shopManagementRouter.post("/my-shop/products", createMyShopProductController);
shopManagementRouter.put(
  "/my-shop/products/:productId",
  updateMyShopProductController
);
shopManagementRouter.delete(
  "/my-shop/products/:productId",
  deleteMyShopProductController
);

// Orders
shopManagementRouter.get("/my-shop/orders", getMyShopOrdersController);
shopManagementRouter.get("/my-shop/orders/:orderId", getMyShopOrderController);
shopManagementRouter.put(
  "/my-shop/orders/:orderId/status",
  updateMyShopOrderStatusController
);

// Analytics
shopManagementRouter.get("/my-shop/analytics", getMyShopAnalyticsController);

// Reviews
shopManagementRouter.get("/my-shop/reviews", getMyShopReviewsController);

// Followers
shopManagementRouter.get("/my-shop/followers", getMyShopFollowersController);

// Batch printing
shopManagementRouter.post("/my-shop/orders/batch-print", batchPrintOrdersController);

// Internal notes
shopManagementRouter.post("/my-shop/orders/:orderId/notes", addInternalNoteController);
shopManagementRouter.get("/my-shop/orders/:orderId/notes", getInternalNotesController);
shopManagementRouter.delete("/my-shop/orders/notes/:noteId", deleteInternalNoteController);

// Order timeline
shopManagementRouter.get("/my-shop/orders/:orderId/timeline", getOrderTimelineController);

export default shopManagementRouter;
