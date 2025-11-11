"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shop_controller_1 = require("./shop.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const shopRouter = (0, express_1.Router)();
shopRouter.get("/", shop_controller_1.listShopController);
shopRouter.get("/:id", shop_controller_1.getShopController);
shopRouter.post("/", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "user"]), shop_controller_1.createShopController);
shopRouter.put("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin", "shop"]), shop_controller_1.updateShopController);
shopRouter.delete("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), shop_controller_1.deleteShopController);
// Follow / Unfollow shop
shopRouter.post("/:id/follow", auth_middleware_1.authenticateToken, shop_controller_1.followShopController);
shopRouter.delete("/:id/follow", auth_middleware_1.authenticateToken, shop_controller_1.unfollowShopController);
shopRouter.get("/:id/following", auth_middleware_1.authenticateToken, shop_controller_1.isFollowingShopController);
shopRouter.get("/:id/followers/count", shop_controller_1.followersCountController);
exports.default = shopRouter;
