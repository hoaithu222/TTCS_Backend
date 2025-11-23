"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const home_controller_1 = require("./home.controller");
const home_configuration_controller_1 = require("./home-configuration.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const home_configuration_service_1 = __importDefault(require("./home-configuration.service"));
const response_util_1 = require("../../shared/utils/response.util");
const homeRouter = (0, express_1.Router)();
// Home page endpoints (public, no auth required)
homeRouter.get("/banner", home_controller_1.getBannerController);
homeRouter.get("/categories", home_controller_1.getHomeCategoriesController);
homeRouter.get("/best-seller", home_controller_1.getBestSellerProductsController);
homeRouter.get("/best-shops", home_controller_1.getBestShopsController);
homeRouter.get("/flash-sale", home_controller_1.getFlashSaleProductsController);
homeRouter.get("/search-suggestion", home_controller_1.getSearchSuggestionsController);
// Home configuration endpoints
// IMPORTANT: Admin routes must be defined BEFORE public routes to avoid route conflicts
// Admin endpoints for managing home configuration
homeRouter.get("/admin/configuration", auth_middleware_1.authenticateToken, home_configuration_controller_1.getAllConfigurationsController);
homeRouter.get("/admin/configuration/:id", auth_middleware_1.authenticateToken, home_configuration_controller_1.getConfigurationByIdController);
homeRouter.post("/admin/configuration", auth_middleware_1.authenticateToken, home_configuration_controller_1.createConfigurationController);
homeRouter.put("/admin/configuration/:id", auth_middleware_1.authenticateToken, home_configuration_controller_1.updateConfigurationController);
homeRouter.delete("/admin/configuration/:id", auth_middleware_1.authenticateToken, home_configuration_controller_1.deleteConfigurationController);
// Public endpoints for configuration
homeRouter.get("/configuration", home_configuration_controller_1.getActiveConfigurationController);
homeRouter.get("/configuration/:id", home_configuration_controller_1.getConfigurationByIdController);
// Public endpoint to get all configurations list (for user selection)
homeRouter.get("/configurations", async (req, res) => {
    // Return list of all configurations (public, no auth required)
    const result = await home_configuration_service_1.default.getAllConfigurations();
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    // Return only basic info for selection
    const configsList = result.configurations?.map((config) => ({
        _id: config._id,
        isActive: config.isActive,
        createdAt: config.createdAt,
    })) || [];
    return response_util_1.ResponseUtil.success(res, { configurations: configsList });
});
exports.default = homeRouter;
