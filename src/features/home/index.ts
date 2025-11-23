import { Router } from "express";
import {
  getBannerController,
  getHomeCategoriesController,
  getBestSellerProductsController,
  getBestShopsController,
  getFlashSaleProductsController,
  getSearchSuggestionsController,
} from "./home.controller";
import {
  getActiveConfigurationController,
  getAllConfigurationsController,
  getConfigurationByIdController,
  createConfigurationController,
  updateConfigurationController,
  deleteConfigurationController,
} from "./home-configuration.controller";
import { authenticateToken } from "../../shared/middlewares/auth.middleware";
import HomeConfigurationService from "./home-configuration.service";
import { ResponseUtil } from "../../shared/utils/response.util";

const homeRouter = Router();

// Home page endpoints (public, no auth required)
homeRouter.get("/banner", getBannerController);
homeRouter.get("/categories", getHomeCategoriesController);
homeRouter.get("/best-seller", getBestSellerProductsController);
homeRouter.get("/best-shops", getBestShopsController);
homeRouter.get("/flash-sale", getFlashSaleProductsController);
homeRouter.get("/search-suggestion", getSearchSuggestionsController);

// Home configuration endpoints
// IMPORTANT: Admin routes must be defined BEFORE public routes to avoid route conflicts
// Admin endpoints for managing home configuration
homeRouter.get(
  "/admin/configuration",
  authenticateToken,
  getAllConfigurationsController
);
homeRouter.get(
  "/admin/configuration/:id",
  authenticateToken,
  getConfigurationByIdController
);
homeRouter.post(
  "/admin/configuration",
  authenticateToken,
  createConfigurationController
);
homeRouter.put(
  "/admin/configuration/:id",
  authenticateToken,
  updateConfigurationController
);
homeRouter.delete(
  "/admin/configuration/:id",
  authenticateToken,
  deleteConfigurationController
);

// Public endpoints for configuration
homeRouter.get("/configuration", getActiveConfigurationController);
homeRouter.get("/configuration/:id", getConfigurationByIdController);
// Public endpoint to get all configurations list (for user selection)
homeRouter.get("/configurations", async (req, res) => {
  // Return list of all configurations (public, no auth required)
  const result = await HomeConfigurationService.getAllConfigurations();
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  // Return only basic info for selection
  const configsList = result.configurations?.map((config: any) => ({
    _id: config._id,
    isActive: config.isActive,
    createdAt: config.createdAt,
  })) || [];
  return ResponseUtil.success(res, { configurations: configsList });
});

export default homeRouter;
