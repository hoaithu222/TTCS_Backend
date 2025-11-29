"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orders_controller_1 = require("./orders.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const ordersRouter = (0, express_1.Router)();
// List orders (admin, shop, or owner filtered via query)
ordersRouter.get("/", auth_middleware_1.authenticateToken, orders_controller_1.listOrdersController);
// Order tracking detail
ordersRouter.get("/:id/track", auth_middleware_1.authenticateToken, orders_controller_1.trackOrderController);
// Reorder: add order items back to cart
ordersRouter.post("/:id/reorder", auth_middleware_1.authenticateToken, orders_controller_1.reorderOrderController);
// Get order by id (owner or admin)
ordersRouter.get("/:id", auth_middleware_1.authenticateToken, orders_controller_1.getOrderController);
// Create new order (authenticated user)
ordersRouter.post("/", auth_middleware_1.authenticateToken, orders_controller_1.createOrderController);
// Update order (admin only or future: shop)
ordersRouter.put("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), orders_controller_1.updateOrderController);
// Update order status (admin only or future: shop)
ordersRouter.put("/:id/status", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), orders_controller_1.updateOrderStatusController);
// Cancel order by owner (only if not shipped/processed beyond processing)
ordersRouter.put("/:id/cancel", auth_middleware_1.authenticateToken, orders_controller_1.cancelOrderByUserController);
// Delete order (admin)
ordersRouter.delete("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), orders_controller_1.deleteOrderController);
// Auto cancel unpaid orders older than 24h (admin / cron)
ordersRouter.post("/auto-cancel-unpaid", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), orders_controller_1.autoCancelUnpaidOrdersController);
exports.default = ordersRouter;
