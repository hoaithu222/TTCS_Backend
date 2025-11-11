"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const home_controller_1 = require("./home.controller");
const homeRouter = (0, express_1.Router)();
// Home page endpoints (public, no auth required)
homeRouter.get("/banner", home_controller_1.getBannerController);
homeRouter.get("/categories", home_controller_1.getHomeCategoriesController);
homeRouter.get("/best-seller", home_controller_1.getBestSellerProductsController);
homeRouter.get("/best-shops", home_controller_1.getBestShopsController);
homeRouter.get("/flash-sale", home_controller_1.getFlashSaleProductsController);
homeRouter.get("/search-suggestion", home_controller_1.getSearchSuggestionsController);
exports.default = homeRouter;
