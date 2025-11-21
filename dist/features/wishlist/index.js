"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wishlist_controller_1 = require("./wishlist.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const wishlistRouter = (0, express_1.Router)();
// Get wishlist
wishlistRouter.get("/", auth_middleware_1.authenticateToken, wishlist_controller_1.getWishlistController);
// Add product to wishlist
wishlistRouter.post("/:productId", auth_middleware_1.authenticateToken, wishlist_controller_1.addToWishlistController);
// Remove product from wishlist
wishlistRouter.delete("/:productId", auth_middleware_1.authenticateToken, wishlist_controller_1.removeFromWishlistController);
// Check if product is in wishlist
wishlistRouter.get("/:productId/check", auth_middleware_1.authenticateToken, wishlist_controller_1.checkWishlistController);
// Clear entire wishlist
wishlistRouter.delete("/", auth_middleware_1.authenticateToken, wishlist_controller_1.clearWishlistController);
exports.default = wishlistRouter;
