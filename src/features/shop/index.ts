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
  getShopStatusByUserIdController,
  approveShopController,
  rejectShopController,
  suspendShopController,
  getShopReviewsController,
} from "./shop.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const shopRouter = Router();

shopRouter.get("/", listShopController);
shopRouter.get("/status/user/:userId", getShopStatusByUserIdController);
shopRouter.get("/:id/reviews", getShopReviewsController);
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

// Admin actions: approve, reject, suspend
shopRouter.post(
  "/:id/approve",
  authenticateToken,
  authorize(["admin"]),
  approveShopController
);
shopRouter.post(
  "/:id/reject",
  authenticateToken,
  authorize(["admin"]),
  rejectShopController
);
shopRouter.post(
  "/:id/suspend",
  authenticateToken,
  authorize(["admin"]),
  suspendShopController
);

export default shopRouter;
