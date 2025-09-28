import { Router } from "express";
import {
  getSubCategoryController,
  createSubCategoryController,
  updateSubCategoryController,
  deleteSubCategoryController,
  listSubCategoryController,
} from "./subCategory.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const subCategoryRouter = Router();

subCategoryRouter.get("/", listSubCategoryController);
subCategoryRouter.get("/:id", getSubCategoryController);
subCategoryRouter.post(
  "/",
  authenticateToken,
  authorize(["admin"]),
  createSubCategoryController
);
subCategoryRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  updateSubCategoryController
);
subCategoryRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  deleteSubCategoryController
);

export default subCategoryRouter;
