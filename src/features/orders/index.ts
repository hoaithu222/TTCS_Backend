import { Router } from "express";
import {
  createOrderController,
  deleteOrderController,
  getOrderController,
  listOrdersController,
  updateOrderController,
  updateOrderStatusController,
} from "./orders.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const ordersRouter = Router();

// List orders (admin, shop, or owner filtered via query)
ordersRouter.get("/", authenticateToken, listOrdersController);

// Get order by id (owner or admin)
ordersRouter.get("/:id", authenticateToken, getOrderController);

// Create new order (authenticated user)
ordersRouter.post("/", authenticateToken, createOrderController);

// Update order (admin only or future: shop)
ordersRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  updateOrderController
);

// Update order status (admin only or future: shop)
ordersRouter.put(
  "/:id/status",
  authenticateToken,
  authorize(["admin"]),
  updateOrderStatusController
);

// Delete order (admin)
ordersRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  deleteOrderController
);

export default ordersRouter;
