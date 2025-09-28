import { Router } from "express";
import {
  getCartController,
  addCartItemController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
} from "./cart.controller";
import { authenticateToken } from "../../shared/middlewares/auth.middleware";

const cartRouter = Router();

cartRouter.get("/", authenticateToken, getCartController);
cartRouter.post("/items", authenticateToken, addCartItemController);
cartRouter.put("/items/:itemId", authenticateToken, updateCartItemController);
cartRouter.delete(
  "/items/:itemId",
  authenticateToken,
  removeCartItemController
);
cartRouter.delete("/", authenticateToken, clearCartController);

// TODO: cart by shop (optional): cartRouter.get("/shop", authenticateToken, getCartByShopController)

export default cartRouter;
