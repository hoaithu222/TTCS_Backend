import { Router } from "express";
import {
  getCategoryController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  getCategoriesController,
  getSubCategoriesController,
} from "./category.controller";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

const categoryRouter = Router();

categoryRouter.get("/", getCategoriesController);
categoryRouter.get("/:id", getCategoryController);
categoryRouter.get("/:id/sub-categories", getSubCategoriesController);
categoryRouter.post(
  "/",
  authenticateToken,
  authorize(["admin"]),
  createCategoryController
);
categoryRouter.put(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  updateCategoryController
);
categoryRouter.delete(
  "/:id",
  authenticateToken,
  authorize(["admin"]),
  deleteCategoryController
);

export default categoryRouter;
