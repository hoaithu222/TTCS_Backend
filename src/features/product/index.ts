import { Router } from "express";
import {
  getProductController,
  createProductController,
  updateProductController,
  deleteProductController,
  listProductController,
} from "./product.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const productRouter = Router();

productRouter.get("/", listProductController);
productRouter.get("/:id", getProductController);
productRouter.post(
  "/",
  authenticateToken,
  authorize(["admin"]),
  createProductController
);
productRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  updateProductController
);
productRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  deleteProductController
);

export default productRouter;
