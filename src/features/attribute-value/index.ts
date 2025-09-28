import { Router } from "express";
import {
  getAttributeValueController,
  createAttributeValueController,
  updateAttributeValueController,
  deleteAttributeValueController,
  listAttributeValueController,
} from "./attributeValue.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const attributeValueRouter = Router();

attributeValueRouter.get("/", listAttributeValueController);
attributeValueRouter.get("/:id", getAttributeValueController);
attributeValueRouter.post(
  "/",
  authenticateToken,
  authorize(["admin"]),
  createAttributeValueController
);
attributeValueRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  updateAttributeValueController
);
attributeValueRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  deleteAttributeValueController
);

export default attributeValueRouter;

