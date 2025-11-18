"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("./product.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const productRouter = (0, express_1.Router)();
// Public routes - Order matters! More specific routes first
productRouter.get("/search", product_controller_1.searchProductController);
productRouter.get("/featured", product_controller_1.getFeaturedProductsController);
productRouter.get("/recommended", product_controller_1.getRecommendedProductsController);
productRouter.get("/", product_controller_1.listProductController);
productRouter.get("/:id/related", product_controller_1.getRelatedProductsController);
productRouter.get("/:id/reviews", product_controller_1.getProductReviewsController);
productRouter.post("/:id/view", product_controller_1.trackProductViewController);
productRouter.get("/:id", product_controller_1.getProductController);
// Protected routes
productRouter.post("/", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "shop"]), product_controller_1.createProductController);
productRouter.put("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "shop"]), product_controller_1.updateProductController);
productRouter.delete("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "shop"]), product_controller_1.deleteProductController);
exports.default = productRouter;
