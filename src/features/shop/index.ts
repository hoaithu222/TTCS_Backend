import { Router } from "express";
import {
  getShopController,
  createShopController,
  updateShopController,
  deleteShopController,
  listShopController,
  followShopController,
  unfollowShopController,
  isFollowingShopController,
  followersCountController,
} from "./shop.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const shopRouter = Router();

shopRouter.get("/", listShopController);
shopRouter.get("/:id", getShopController);
shopRouter.post(
  "/",
  authenticateToken,
  authorize(["admin", "user"]),
  createShopController
);
shopRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin", "shop"]),
  updateShopController
);
shopRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  deleteShopController
);

// Follow / Unfollow shop
shopRouter.post("/:id/follow", authenticateToken, followShopController);
shopRouter.delete("/:id/follow", authenticateToken, unfollowShopController);
shopRouter.get("/:id/following", authenticateToken, isFollowingShopController);
shopRouter.get("/:id/followers/count", followersCountController);

export default shopRouter;
