import { Router } from "express";
import {
  getShopController,
  createShopController,
  updateShopController,
  deleteShopController,
  listShopController,
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
  authorize(["admin"]),
  createShopController
);
shopRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  updateShopController
);
shopRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  deleteShopController
);

export default shopRouter;
