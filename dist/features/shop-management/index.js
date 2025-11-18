"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shop_management_controller_1 = require("./shop-management.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const shopManagementRouter = (0, express_1.Router)();
// Tất cả routes đều yêu cầu authentication
// Không yêu cầu role cụ thể vì user có thể tạo shop và quản lý shop của mình
shopManagementRouter.use(auth_middleware_1.authenticateToken);
// Cho phép tất cả user đã authenticated truy cập (service sẽ check shop ownership)
// Shop info
shopManagementRouter.get("/my-shop", shop_management_controller_1.getMyShopController);
shopManagementRouter.put("/my-shop", shop_management_controller_1.updateMyShopController);
// Products
shopManagementRouter.get("/my-shop/products", shop_management_controller_1.getMyShopProductsController);
shopManagementRouter.get("/my-shop/products/:productId", shop_management_controller_1.getMyShopProductController);
shopManagementRouter.post("/my-shop/products", shop_management_controller_1.createMyShopProductController);
shopManagementRouter.put("/my-shop/products/:productId", shop_management_controller_1.updateMyShopProductController);
shopManagementRouter.delete("/my-shop/products/:productId", shop_management_controller_1.deleteMyShopProductController);
// Orders
shopManagementRouter.get("/my-shop/orders", shop_management_controller_1.getMyShopOrdersController);
shopManagementRouter.get("/my-shop/orders/:orderId", shop_management_controller_1.getMyShopOrderController);
shopManagementRouter.put("/my-shop/orders/:orderId/status", shop_management_controller_1.updateMyShopOrderStatusController);
// Analytics
shopManagementRouter.get("/my-shop/analytics", shop_management_controller_1.getMyShopAnalyticsController);
// Reviews
shopManagementRouter.get("/my-shop/reviews", shop_management_controller_1.getMyShopReviewsController);
// Followers
shopManagementRouter.get("/my-shop/followers", shop_management_controller_1.getMyShopFollowersController);
exports.default = shopManagementRouter;
