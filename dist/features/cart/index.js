"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("./cart.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const cartRouter = (0, express_1.Router)();
cartRouter.get("/", auth_middleware_1.authenticateToken, cart_controller_1.getCartController);
cartRouter.post("/items", auth_middleware_1.authenticateToken, cart_controller_1.addCartItemController);
cartRouter.put("/items/:itemId", auth_middleware_1.authenticateToken, cart_controller_1.updateCartItemController);
cartRouter.delete("/items/:itemId", auth_middleware_1.authenticateToken, cart_controller_1.removeCartItemController);
cartRouter.delete("/", auth_middleware_1.authenticateToken, cart_controller_1.clearCartController);
// TODO: cart by shop (optional): cartRouter.get("/shop", authenticateToken, getCartByShopController)
exports.default = cartRouter;
