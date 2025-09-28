import { Router } from "express";
import {
  getAttributeTypeController,
  createAttributeTypeController,
  updateAttributeTypeController,
  deleteAttributeTypeController,
  listAttributeTypeController,
} from "./attributeType.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const attributeTypeRouter = Router();

attributeTypeRouter.get("/", listAttributeTypeController);
attributeTypeRouter.get("/:id", getAttributeTypeController);
attributeTypeRouter.post(
  "/",
  authenticateToken,
  authorize(["admin"]),
  createAttributeTypeController
);
attributeTypeRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  updateAttributeTypeController
);
attributeTypeRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  deleteAttributeTypeController
);

export default attributeTypeRouter;

