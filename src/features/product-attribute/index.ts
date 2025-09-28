import { Router } from "express";
import {
  getProductAttributeController,
  createProductAttributeController,
  updateProductAttributeController,
  deleteProductAttributeController,
  listProductAttributeController,
} from "./productAttribute.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const productAttributeRouter = Router();

productAttributeRouter.get("/", listProductAttributeController);
productAttributeRouter.get("/:id", getProductAttributeController);
productAttributeRouter.post(
  "/",
  authenticateToken,
  authorize(["admin", "shop"]),
  createProductAttributeController
);
productAttributeRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin", "shop"]),
  updateProductAttributeController
);
productAttributeRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin", "shop"]),
  deleteProductAttributeController
);

export default productAttributeRouter;
