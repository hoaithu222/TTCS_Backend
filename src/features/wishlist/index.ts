import { Router } from "express";
import {
  getWishlistController,
  addToWishlistController,
  removeFromWishlistController,
  clearWishlistController,
  checkWishlistController,
} from "./wishlist.controller";
import { authenticateToken } from "../../shared/middlewares/auth.middleware";

const wishlistRouter = Router();

// Get wishlist
wishlistRouter.get("/", authenticateToken, getWishlistController);

// Add product to wishlist
wishlistRouter.post("/:productId", authenticateToken, addToWishlistController);

// Remove product from wishlist
wishlistRouter.delete(
  "/:productId",
  authenticateToken,
  removeFromWishlistController
);

// Check if product is in wishlist
wishlistRouter.get(
  "/:productId/check",
  authenticateToken,
  checkWishlistController
);

// Clear entire wishlist
wishlistRouter.delete("/", authenticateToken, clearWishlistController);

export default wishlistRouter;

