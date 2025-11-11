"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orders_controller_1 = require("./orders.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const ordersRouter = (0, express_1.Router)();
// List orders (admin, shop, or owner filtered via query)
ordersRouter.get("/", auth_middleware_1.authenticateToken, orders_controller_1.listOrdersController);
// Get order by id (owner or admin)
ordersRouter.get("/:id", auth_middleware_1.authenticateToken, orders_controller_1.getOrderController);
// Create new order (authenticated user)
ordersRouter.post("/", auth_middleware_1.authenticateToken, orders_controller_1.createOrderController);
// Update order (admin only or future: shop)
ordersRouter.put("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), orders_controller_1.updateOrderController);
// Update order status (admin only or future: shop)
ordersRouter.put("/:id/status", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), orders_controller_1.updateOrderStatusController);
// Delete order (admin)
ordersRouter.delete("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), orders_controller_1.deleteOrderController);
exports.default = ordersRouter;
