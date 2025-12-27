import { Router } from "express";
import {
  getProductController,
  createProductController,
  updateProductController,
  deleteProductController,
  listProductController,
  searchProductController,
  getFeaturedProductsController,
  getRecommendedProductsController,
  getRelatedProductsController,
  trackProductViewController,
  getProductReviewsController,
  createProductReviewController,
  updateProductStatusController,
} from "./product.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const productRouter = Router();

// Public routes - Order matters! More specific routes first
productRouter.get("/search", searchProductController);
productRouter.get("/featured", getFeaturedProductsController);
productRouter.get("/recommended", getRecommendedProductsController);
productRouter.get("/", listProductController);
productRouter.get("/:id/related", getRelatedProductsController);
productRouter.get("/:id/reviews", getProductReviewsController);
productRouter.post(
  "/:id/reviews",
  authenticateToken,
  createProductReviewController
);
productRouter.post("/:id/view", trackProductViewController);
productRouter.get("/:id", getProductController);

// Protected routes
productRouter.post(
  "/",
  authenticateToken,
  authorize(["admin", "shop"]),
  createProductController
);
productRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin", "shop"]),
  updateProductController
);
productRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin", "shop"]),
  deleteProductController
);

// Admin only - Update product status
productRouter.patch(
  "/:id/status",
  authenticateToken,
  authorize(["admin"]),
  updateProductStatusController
);

export default productRouter;
